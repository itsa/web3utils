import managedPromise from '../../managedPromise';
import walletEvents from './wallet-events';
import eventSeverities from './severities';

class Wallet {
    constructor(validChainIds) {
        const instance = this;
        instance.activated = false;
        instance.address = '';
        instance.chainId = null;
        instance.locked = true;
        instance.name = 'no wallet';
        instance.hardwareWallet = false;
        instance._validChainIds = validChainIds;
        instance.accounts = [];
        instance.initializationPromise = managedPromise();
        instance.emitter = walletEvents;
        instance.eventSeverities  = eventSeverities;
    }

    async activate() {
        this.deactivate();
        return false;
    }
    // CAREFULL: do NOT use `async` because that will return an native Promise-A+ object. But we need a manipulated Promise with extra features
    isInitialized() {
        return this.initializationPromise;
    }
    deactivate() {
        const instance = this;
        instance.activated = false;
        instance.accounts = [];
        instance.address = '';
        instance.chainId = null;
        instance.locked = true;
    }
    networkConnected() {
        return false;
    }
    async sendTx() {}
    async switchToNetwork() {}
    async isInstalled() {
        false;
    }
    onUpdate(cb) {
        if (typeof cb === 'function') {
            this._forceUpdateFn = cb;
        }
    }
    forceUpdateContext() {
        const cb = this._forceUpdateFn;
        if (typeof cb === 'function') {
            cb();
        }
    }
    async sendTx() {
    }
    async switchToNetwork() {
    }
}

export default Wallet;
