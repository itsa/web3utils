import { cloneDeep } from 'lodash';
import { ethers } from "ethers";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBT from "@ledgerhq/hw-transport-web-ble";
import getGasPrice from './get-gasprice';
import getNonce from './get-nonce';
import { delay } from '../../timers';
import toBN from '../../toBN';
import AppEth, { ledgerService } from "@ledgerhq/hw-app-eth";

const PURPOSE = 44;
const COINTYPE = 60; // we can only request ethereum addresses
const ACCOUNT = 0;
const EXTERNAL = true;

const BLOCK_GAS_LIMIT = toBN('30000000');

const EVENT_CONNECT_TO_LEDGER = 'Connect to your Ledger Device';
const EVENT_SELECT_ETHEREUM_APP = 'Select the Ethereum App';
const EVENT_WRONG_DEVICE_LIST_BIG = 'Wrong Ledger found: please detach your other Ledger Devices';
const EVENT_WRONG_DEVICE_LIST_ONE = 'Wrong Ledger found: make sure to connect your right Ledger Device';
const EVENT_SIGN_TRANSACTION = 'Please sign your Transaction on your Ledger Device';

class Ledger {
    constructor(devicePropertyUpdateFn, eventsFn, bluetooth) {
        const instance = this;
        instance.bluetooth = bluetooth;
        instance.Transport = bluetooth ? TransportWebBT : TransportWebUSB;
        instance._devicePropertyUpdateFn = devicePropertyUpdateFn;
        instance._eventsFn = eventsFn;
        instance._busyReadingAccounts = false;
        instance._events = {};
        instance.active = false;
        instance.hardwareStatus = 0;
    }

    emit(message = '', level = 0, cleanup) {
        const instance = this;
        if (cleanup) {
            if (!message) {
                instance._events = {};
                instance._setHardwareStatus();
            }
            else if (instance._events[level]) {
                const key = message || '#';
                delete instance._events[level][key];
            }
        } else {
            if (!instance._events[level]) {
                instance._events[level] = {};
            }
            const key = message || '#';
            instance._events[level][key] = true;
        }
        instance._setHardwareStatus();
        if (typeof instance._eventsFn === 'function') {
            if (!cleanup) {
                instance._eventsFn(message, level);
            } else {
                if (message) {
                    instance._eventsFn(message, -1); // cleanup
                } else {
                    instance._eventsFn(EVENT_CONNECT_TO_LEDGER, -1); // cleanop all
                    instance._eventsFn(EVENT_WRONG_DEVICE_LIST_BIG, -1); // cleanop all
                    instance._eventsFn(EVENT_WRONG_DEVICE_LIST_ONE, -1); // cleanop all
                    instance._eventsFn(EVENT_SIGN_TRANSACTION, -1); // cleanop all
                }
            }
        }
    }

    cleanupEvent(message, level) {
        this.emit(message, level, true);
    }

    cleanupAllEvents() {
        this.emit(null, null, true);
    }

    emitPropertyChange(prop, value) {
        const instance = this;
        if (typeof instance._devicePropertyUpdateFn === 'function') {
            instance._devicePropertyUpdateFn(prop, value);
        }
    }

    async _getTransport() {
        const instance = this;
        return new Promise((fulfill, reject) => {
            const sub = instance.Transport.listen({
                next: async e => {
                    if (e.type === 'add') {
                        sub.unsubscribe();
                        const transportItem = e.descriptor;
                        const response = await instance.attachDevice(transportItem);
                        if (response.status === 'ok') {
                            fulfill(response.transport);
                        } else {
                            reject(response.message);
                        }
                    }
                },
                error: error => {
                    console.error(error);
                    sub.unsubscribe();
                    reject(error.message || error);
                },
                complete: () => {
                    // sub.unsubscribe();
                },
              });
        });
    };

    cancelReadHardwareAccounts() {
        this._busyReadingAccounts = false;
    }

    async readHardwareAccounts(chainId, accounts, count = 5) {
        const instance = this;
        if (accounts.length >= count) {
            return;
        }
        instance._busyReadingAccounts = true;
        if (typeof chainId !== 'number') {
            chainId = instance.chainId;
        }
        try {
            await instance._getAccounts(chainId, accounts, count);
        }
        catch(err) {
            console.error(err);
        }
        instance._busyReadingAccounts = false;
    }

    async getDeviceName(transport) {
        const instance = this;
        let deviceName;
        if (!transport) {
            try {
                transport = await instance._getTransport();
                instance.cleanupEvent(message, 2); // cleanup
            }
            catch (err) {
                instance.emit(EVENT_CONNECT_TO_LEDGER, 2);
                transport = null;
            }
        }
        deviceName = transport && transport.deviceModel.productName;
        return deviceName;
    }

    async _getLedgerList() {
        let list;
        try {
            list = await instance.Transport.list();
            instance.cleanupEvent(EVENT_CONNECT_TO_LEDGER, 2); // cleanup
        }
        catch (err) {
            instance.emit(EVENT_CONNECT_TO_LEDGER, 2);
            list = [];
        }
        return list;
    };

    async _getEth(firstAddress) {
        const instance = this;
        let appEth;
        try {
            const transport = await instance._getTransport();
            if (!transport) {
                instance.cleanupEvent(EVENT_CONNECT_TO_LEDGER, 2);
            }
            if (!transport || !instance.active) { // meanwhile deactivated? then return
                return;
            }

            // remove:
            // instance.cleanupEvent(EVENT_CONNECT_TO_LEDGER, 2);

            appEth = new AppEth(transport);
            if (!appEth) {
                instance.emit(EVENT_SELECT_ETHEREUM_APP, 2);
            } else {
                if (firstAddress) {
                    // check if we have the right ledger (in case there are multiple attached)
                    const deriviationPath = `${PURPOSE}'/${COINTYPE}'/${ACCOUNT}'/${EXTERNAL ? 0 : 1}/0`;
                    const { address } = await appEth.getAddress(deriviationPath);
                    instance.cleanupEvent(EVENT_SELECT_ETHEREUM_APP, 2);
                    if (address) {
                        if (address !== firstAddress) {
                            const list = await instance._getLedgerList();
                            if (list.lenght > 1) {
                                instance.emit(EVENT_WRONG_DEVICE_LIST_BIG, 3);
                            } else {
                                instance.emit(EVENT_WRONG_DEVICE_LIST_ONE, 3);
                            }
                            appEth = null;
                        } else {
                            instance.cleanupAllEvents(); // cleanup
                        }
                    }
                }
            }
        }
        catch (err) {
            console.error(err);
            instance.emit(EVENT_CONNECT_TO_LEDGER, 2);
            appEth = null;
        }
        return appEth;
    }

    _setHardwareStatus() {
        const instance = this;
        const levels = Object.keys(instance._events).map(level => parseInt(level, 10));
        let val;
        if (levels.length > 0) {
            levels.sort();
            val = levels[levels.length - 1];
        } else {
            val = 0;
        }
        instance.hardwareStatus = val;
        instance.emitPropertyChange('hardwareStatus', val);
    }

    async _getAccounts(chainId, accounts, count) {
        const instance = this;
        if (!instance.active) { // meanwhile deactivated? then return
            return;
        }
        // detach connection with parent accounts:
        accounts = cloneDeep(accounts);
        const skip = accounts.length;
        if (!!chainId) {
            let appConnected = true; // assume to be true, initially
            let eth;
            try {
                const firstAddress = accounts[0];
                eth = await instance._getEth(firstAddress);
            }
            catch (err) {
                console.error(err);
                instance.emit(EVENT_CONNECT_TO_LEDGER, 2);
            }
            if (eth) {
                for (let i = skip; i < count && (instance.hardwareStatus !== 3) && instance.active && instance._busyReadingAccounts && appConnected; i++) {
                    try {
                        if (!instance.active) { // meanwhile deactivated? then return
                            break;
                        }
                        const deriviationPath = `${PURPOSE}'/${COINTYPE}'/${ACCOUNT}'/${EXTERNAL ? 0 : 1}/${i}`;
                        const { address } = await eth.getAddress(deriviationPath);
                        if (address) {
                            instance.cleanupAllEvents(); // cleanup all, because everything is ok
                            accounts[i] = address;
                            instance.emitPropertyChange('accounts', cloneDeep(accounts));
                        } else {
                            appConnected = false;
                            instance.emit(EVENT_SELECT_ETHEREUM_APP, 2);
                        }
                        if (!instance.active) { // meanwhile deactivated? then return
                            break;
                        }
                    }
                    catch (err) {
                        console.error(err);
                        appConnected = false;
                        instance.emit(EVENT_SELECT_ETHEREUM_APP, 2);
                    }
                }
            }
        }
        const allFound = accounts.length >= count;
        if (!instance.active) {
            instance._busyReadingAccounts = false;
        }
        if (!allFound && instance._busyReadingAccounts) {
            await delay(1000);
            await instance._getAccounts(chainId, accounts, count);
        }
    }

    async attachDevice(transportItem) {
        const instance = this;
        let transport = null;
        let status = 'ok';
        let message = '';
        let devicename = '';
        try {
            if (transportItem) {
                transport = await instance.Transport.open(transportItem);
                devicename = transportItem.productName;
            }
            else {
                transport = await instance.Transport.create();
            }
        }
        catch (err) {
            console.error(err);
            transport = null;
            devicename = '';
            status = 'error';
            message = 'Could not connect to Ledger Device';
        }
        return {
            status,
            message,
            devicename,
            transport
        }
    }

    async releaseTransport(transport) {
        if (transport && typeof transport.close === 'function') {
            try {
                transport.close();
            }
            catch (err) {
                console.error('Error transport.close();', err);
            }
        }
    }

    async sendTx(rawTx, sender, accountIndex, firstAddress, {web3, extraPercentageGas}) {
        const instance = this;
        let txResponse;
        if (sender) {
            try {
                const eth = await instance._getEth(firstAddress);
                if (eth) {
                    rawTx = cloneDeep(rawTx);
                    rawTx.gasPrice = await getGasPrice(web3, extraPercentageGas);
                    rawTx.nonce = await getNonce(sender, web3, true);
                    rawTx.chainId = instance.chainId;
                    rawTx.gasLimit = web3.utils.toHex(BLOCK_GAS_LIMIT);
                    delete rawTx.from; // clear: not needed on Ledger (would throw an error)

                    const unsignedTx = ethers.utils.serializeTransaction(rawTx);

                    //Sign with the Ledger Nano (Sign what you see)
                    const deriviationPath = `${PURPOSE}'/${COINTYPE}'/${ACCOUNT}'/${EXTERNAL ? 0 : 1}/${accountIndex}`;

                    instance.emit(EVENT_SIGN_TRANSACTION, 1);

                    const resolution = await ledgerService.resolveTransaction(unsignedTx.substring(2));
                    const signature = await eth.signTransaction(deriviationPath, unsignedTx.substring(2), resolution);

                    instance.cleanupAllEvents(); // cleanup all, because everything is ok

                    //Parse the signature
                    signature.r = "0x"+signature.r;
                    signature.s = "0x"+signature.s;
                    signature.v = parseInt(signature.v);
                    signature.from = sender;
                    //Serialize the same transaction as before, but adding the signature on it
                    const signedTx = ethers.utils.serializeTransaction(rawTx, signature);

                    txResponse = await web3.eth.sendSignedTransaction(signedTx);
                    if (!txResponse.status) {
                        throw new TransactionException(txResponse);
                    }
                }
            }
            catch (err) {
                console.error(err);
                const message = (err.message.endsWith('(0x6985)')) ? 'Ledger device: Aborted' : err.message;
                instance.emit(message, 3);
                instance.cleanupEvent(EVENT_SIGN_TRANSACTION, 1); // cleanup
            }
        }
        return txResponse;
    }
}

export default Ledger;
