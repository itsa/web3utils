import HardwareWallet from '../helpers/hardware-wallet-class';
import energiTx from '../helpers/energi-tx';
import { Transaction as Tx } from 'ethereumjs-tx';
import AppBtc from "@ledgerhq/hw-app-btc";
import AppEth from "@ledgerhq/hw-app-eth";
import ledgerService from "@ledgerhq/hw-app-eth/lib/services/ledger"
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
// import TransportWebBT from "@ledgerhq/hw-transport-web-ble";
import { localStorageProperty, delay } from '@itsa.io/web3utils';

const lsConnectedWallet = localStorageProperty('walletconnectbutton', {
    simpleType: true, // we use a boolean
});

const lsLedgerWallet = localStorageProperty('ledgerwallet', {
    simpleType: false, // we use an object
});

class Ledger extends HardwareWallet {
    constructor(validChainIds) {
        super(validChainIds);

        const localstorageObject = lsLedgerWallet.get() || {};
        this.name = 'ledger';
        this.chainId = localstorageObject.chainId || null;
        this.address = localstorageObject.address || '';
        this.accounts = localstorageObject.accounts || [];
        console.debug('localstorageObject', localstorageObject);
    }

    networkConnected() {
        return this.connected && !!this.address;
    }

    async isInstalled() {
        const instance = this;
        if (typeof instance._isSupported !== 'boolean') {
            try {
                instance._isSupported = await TransportWebUSB.isSupported();
            }
            catch (err) {
                instance._isSupported = false;
            }
        }
        return instance._isSupported;
    }

    async attachDevice(transport) {
        const instance = this;
        if (await instance.isInstalled()) {
            try {
                if (transport) {
                    instance.transport = await TransportWebUSB.open(transport);
                }
                else {
                    instance.transport = await TransportWebUSB.create();
                }
            }
            catch (err) {
                instance._emitMessage({message: err.message, level: 2});
                delete instance.transport;
            }
        }
        return instance.transport;
    }

    async getDeviceModel() {
        const instance = this;
        let deviceModel;
        if (await instance.isInstalled() && instance.connected) {
            deviceModel = instance.transport.deviceModel;
        }
        return deviceModel;
    }

    async getDeviceName() {
        const instance = this;
        let deviceName;
        if (await instance.isInstalled() && instance.connected) {
            deviceName = instance.transport.deviceModel.productName;
        }
        return deviceName;
    }

    setSelectDeviceFn(selectDevice) {
        if (typeof selectDevice === 'function') {
            this._selectDeviceFn = selectDevice;
        }
    }

    setMessageListenerFn(listener) {
        if (typeof listener === 'function') {
            this._messageListenerFn = listener;
        }
    }

    async _selectDevice(list) {
        const fn = this._selectDeviceFn;
        if (typeof fn === 'function') {
            const items = list.map(item => item.productName);
            return await fn(items);
        }
        return null;
    }

    _emitMessage(event) {
        const fn = this._messageListenerFn;
        if (typeof fn === 'function') {
            return fn(event);
        }
        return null;
    }

    async connect() {
        const instance = this;
        let success = await super.connect();
        if (success) {
            if (!instance.transport) {
                try {
                    let newDevice;
                    const list = await TransportWebUSB.list();
                    const itemCount = list.length;
                    if (itemCount > 1) {
                        // clear settings of chosen wallet, because we still need to make up our mind
                        // (in case the user closes the browser or form)
                        lsConnectedWallet.set('');
                        const deviceIndex = await instance._selectDevice(list);
                        lsConnectedWallet.set(instance.name);
                        if (typeof deviceIndex === 'number' && (deviceIndex >= 0) && (deviceIndex < itemCount)) {
                            newDevice = await instance.attachDevice(list[deviceIndex]);
                        }
                    }
                    if (!newDevice) {
                        await instance.attachDevice();
                    }
                }
                catch (err) {
                    instance._emitMessage({message: err.message, level: 2});
                }
            }
            const transport = instance.transport;
            if (transport) {
                success = true;
                instance.connected = true;
                instance.forceUpdateContext();
                instance.eth = new AppEth(transport);
                instance.btc = new AppBtc(transport);
            } else {
                instance.connected = false;
            }
        } else {
            instance.connected = false;
        }
        return instance.connected;
    }

    disconnect() {
        delete this.transport;
        super.disconnect();
    }

    async appSelected(appName) {
        const instance = this;
        let success = false;
        if (appName === 'eth') {
            try {
                await instance.eth.getAppConfiguration();
                success = true;
            }
            catch (err) {}
        }
        return success;
    }

    async _getAccounts(chainId, skip = 0) {
        const instance = this;
        const accounts = [];
        if (!chainId) {
            chainId = instance.chainId;
        }
        console.debug('_getaccounts', await instance.isInstalled(), instance.connected, chainId);
        if (await instance.isInstalled() && instance.connected && chainId) {
            const purpose = 44;
            const coinType = 60;
            // const coinType = chainId === 1 ? 60 : chainId;
            const account = 0;
            const external = true;
            const count = 5;
            let errored = false;

            for (let i = skip; i < count && !errored; i++) {
                const deriviationPath = `${purpose}'/${coinType}'/${account}'/${external ? 0 : 1}/${i}`;
                try {
                    const eth = new AppEth(instance.transport);
                    const { address } = await eth.getAddress(deriviationPath);

                    // const { address } = await instance.eth.getAddress(deriviationPath);
                    instance._emitMessage({status: 0}); // status === 0 -> "Ok"
                    accounts.push(address);
                }
                catch (err) {
                    errored = true;
                    console.debug(err);
                    instance._emitMessage({message: err.message, status: 1}); // status === 1 -> "Open the App on your Ledger"
                }
            }
        }
        const count = accounts.length;
        const allFound = count >= 5 - skip;
        console.debug(allFound, count, skip);
        console.debug('accounts', accounts);
        if (!allFound) {
            await delay(5000);
            const remaining = await instance._getAccounts(chainId, count);
            Array.prototype.push.apply(accounts, remaining);
        }
        return accounts;
    }

    async switchToNetwork(chainId) {
        const instance = this;
        const localstorageObject = lsLedgerWallet.get() || {};
        localstorageObject.chainId = chainId;
        instance.chainId = chainId;

        // already store settings: later another time
        delete localstorageObject.address;
        instance.address = '';
        localstorageObject.accounts = [];
        instance.accounts = [];

        // already store settings: later another time
        lsLedgerWallet.set(localstorageObject);
        instance.forceUpdateContext();

        // also find the associated accounts
        try {
            const accounts = await instance._getAccounts(chainId);
            localstorageObject.accounts = accounts;
            instance.accounts = accounts;

            // if the current address is not part of account, then reset:
            if (!accounts.includes(instance.address)) {
                delete localstorageObject.address;
                instance.address = '';
            }
            // save data to localstorage 2nd time
            lsLedgerWallet.set(localstorageObject);
            instance.forceUpdateContext();
        }
        catch (err) {}
    }

    async switchToAddress(address) {
        const instance = this;
        const localstorageObject = lsLedgerWallet.get() || {};
        localstorageObject.address = address;
        lsLedgerWallet.set(localstorageObject);
        instance.address = address;
        instance.forceUpdateContext();
    }

    async sendTx(rawTx) {
        let txConfig;
        if (true) {
            energiCommon = await energiTx.getCommon(web3, networkAddress, networkId, chainId);
            txConfig = { common: energiCommon };
        }
        tx = new Tx(rawTx, txConfig);
        const resolution = await ledgerService.resolveTransaction(tx);
        const result = eth.signTransaction("44'/60'/0'/0/0", tx, resolution);
        console.debug('sendTx', result);

        // Broadcast the transaction to the testnet/mainnet
        serializedTx = tx.serialize();

        txResponse = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
        console.debug(txResponse);
        if (!txResponse.status) {
            throw new Exception(txResponse);
        }
        return txResponse;
    }
}

export default Ledger;
