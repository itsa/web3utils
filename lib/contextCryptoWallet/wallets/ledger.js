import HardwareWallet from '../helpers/hardware-wallet-class';
import Ledger from '../helpers/lib-ledger';
import ledgerLocalstorage from '../helpers/ledger-localstorage';

class LedgerWallet extends HardwareWallet {
    // use ONE transport at the time!!!
    constructor(validChainIds, bluetooth) {
        super(validChainIds);

        const instance = this;
        const cbPropUpdate = instance._devicePropertyUpdate.bind(instance);
        const cbEvents = instance._ledgerEvents.bind(instance);
        instance.ledger = new Ledger(cbPropUpdate, cbEvents, bluetooth);
        instance.bluetooth = !!bluetooth;
        instance.hardwareStatus = instance.ledger.hardwareStatus;
        instance.localstorage = ledgerLocalstorage(instance.bluetooth ? 'ledgerwalletbt' : 'ledgerwallet');
        instance.name = bluetooth ? 'ledgerbt' : 'ledger';
        instance.devicename = instance.localstorage.get('devicename');
        instance.address = instance.localstorage.get('address');
        instance.accounts = instance.localstorage.get('accounts');

        if (instance.address) {
            instance.chainId = instance.localstorage.get('chainId');
        } else {
            // force to choose the network, which will lead into reading of the accounts
            instance.chainId = null;
        }

        instance.initializationPromise.fulfill();
    }

    // handles callbacks from the Ledger Device
    _devicePropertyUpdate(prop, value) {
        const instance = this;
        if (instance.activated) {
            instance[prop] = value;
            instance.localstorage.set(prop, value);
            instance.forceUpdateContext();
        }
    }

    // handles events from the Ledger Hardware
    _ledgerEvents(message, level, needsToSign) {
        const instance = this;
        const type = instance.eventSeverities[level] || 'message';
        instance.emitter.emit(type, message, needsToSign);
    }

    async activate() {
        this.activated = true;
        this.ledger.active = true;
        return true;
    }

    deactivate() {
        this.ledger.active = false;
        this.localstorage.clearAll();
        super.deactivate();
    }

    networkConnected() {
        const instance = this;
        return instance.activated && !!instance.chainId && !!instance.address && (!instance._validChainIds || instance._validChainIds.includes(instance.chainId));
    }

    async switchToNetwork(chainId) {
        const instance = this;
        if (!instance.activated) { // meanwhile diconnected? then return
            return;
        }
        instance.chainId = chainId;
        instance.localstorage.set('chainId', chainId);
        instance.forceUpdateContext();
    }

    async switchToAddress(address) {
        const instance = this;
        if (!instance.activated) { // meanwhile diconnected? then return
            return;
        }
        instance.address = address;
        instance.localstorage.set('address', address);
        instance.forceUpdateContext();
    }

    async sendTx(rawTx, {web3, extraPercentageGas}) {
        const instance = this;
        const accountIndex = instance.accounts.indexOf(instance.address);
        let tx;
        try {
            tx = await instance.ledger.sendTx(rawTx, instance.address, accountIndex, instance.accounts[0], {web3, extraPercentageGas});
        }
        catch (err) {
            console.error(err);
        }
        return tx;
    }

    setSelectDeviceFn(selectDevice) {
        if (typeof selectDevice === 'function') {
            this._selectDeviceFn = selectDevice;
        }
    }

    cancelReadHardwareAccounts() {
        this.ledger.cancelReadHardwareAccounts();
    }

    async readHardwareAccounts(chainId, count = 5) {
        const instance = this;
        try {
            await instance.ledger.readHardwareAccounts(chainId, instance.accounts, count);
        }
        catch (err) {
            console.error(err);
        }
    }

    async getDeviceName() {
        return this.ledger.getDeviceName();
    }
}

export default LedgerWallet;
