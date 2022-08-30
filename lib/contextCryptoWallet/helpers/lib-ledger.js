import { cloneDeep } from 'lodash';
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBT from "@ledgerhq/hw-transport-web-ble";
import managedPromise from '../../managedPromise';
import { delay } from '../../timers';
import AppEth from "@ledgerhq/hw-app-eth";

const PURPOSE = 44;
const COINTYPE = 60; // we can only request ethereum addresses
const ACCOUNT = 0;
const EXTERNAL = true;

class Ledger {
    constructor(devicePropertyUpdateFn, eventsFn, bluetooth) {
        const instance = this;
        instance.bluetooth = bluetooth;
        instance.Transport = bluetooth ? TransportWebBT : TransportWebUSB;
        instance._devicePropertyUpdateFn = devicePropertyUpdateFn;
        instance._eventsFn = eventsFn;
        instance._busyReadingAccounts = false;
        instance.active = false;
        instance.hardwareStatus = 0;
    }

    emit(message, level) {
        const instance = this;
        if (level > instance.hardwareStatus) {
            instance.setHardwareStatus(level);
        }
        if (typeof instance._eventsFn === 'function') {
            instance._eventsFn(message, level);
        }
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
            }
            catch (err) {
                instance.emit('D Connect to your Ledger Device', 2);
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
        }
        catch (err) {
            instance.emit('K Connect to your Ledger Device', 2);
            list = [];
        }
        return list;
    };

    async _getEth(firstAddress) {
        const instance = this;
        let appEth;
        try {
            const transport = await instance._getTransport();
            appEth = new AppEth(transport);
            if (!instance.active) { // meanwhile deactivated? then return
                return;
            }
            if (appEth && firstAddress) {
                // check if we have the right ledger (in case there are multiple attached)
                const deriviationPath = `${PURPOSE}'/${COINTYPE}'/${ACCOUNT}'/${EXTERNAL ? 0 : 1}/0`;
                const { address } = await appEth.getAddress(deriviationPath);
                if (address && address !== firstAddress) {
                    const list = await instance._getLedgerList();
                    if (list.lenght > 1) {
                        instance.emit('Wrong Ledger found: please detach your other Ledger Devices', 2);
                    } else {
                        instance.emit('Wrong Ledger found: make sure to connect your right Ledger Device', 2);
                    }
                    appEth = null;
                }
            }
        }
        catch (err) {
            console.error(err);
            instance.emit('A Connect to your Ledger Device', 2);
            appEth = null;
        }
        return appEth;
    }

    setHardwareStatus(val) {
        const instance = this;
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
                instance.emit('B Connect to your Ledger Device', 2);
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
                            instance.setHardwareStatus(0);
                            accounts[i] = address;
                            instance.emitPropertyChange('accounts', cloneDeep(accounts));
                        } else {
                            appConnected = false;
                        }
                        if (!instance.active) { // meanwhile deactivated? then return
                            break;
                        }
                    }
                    catch (err) {
                        console.error(err);
                        appConnected = false;
                        instance.emit('B Connect to your Ledger Device', 2);
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

    async sendTx(rawTx, accountIndex, {web3, extraPercentageGas}) {
        const instance = this;
        let txResponse;
        if (instance.address) {
            try {
                const eth = await instance._getEth(transport);
                if (eth) {
                    rawTx = cloneDeep(rawTx);
                    delete rawTx.from; // clear: not needed on Ledger (would throw an error)
                    rawTx.gasPrice = await getGasPrice(web3, extraPercentageGas);
                    rawTx.nonce = await getNonce(instance.address, web3, true);
                    rawTx.chainId = instance.chainId;

                    const unsignedTx = ethers.utils.serializeTransaction(rawTx);

                    //Sign with the Ledger Nano (Sign what you see)
                    const deriviationPath = `${PURPOSE}'/${COINTYPE}'/${ACCOUNT}'/${EXTERNAL ? 0 : 1}/${accountIndex}`;

                    instance.emit('Please sign your Transaction on your Ledger Device', 1);

                    const signature = await eth.signTransaction(deriviationPath, unsignedTx.substring(2));

                    //Parse the signature
                    signature.r = "0x"+signature.r;
                    signature.s = "0x"+signature.s;
                    signature.v = parseInt(signature.v);
                    signature.from = instance.address;

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
                instance.emit(err.message, 3);
            }
        }
        return txResponse;
    }
}

export default Ledger;
