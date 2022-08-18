class Wallet {
    constructor(validChainIds) {
        const instance = this;
        instance.accounts = [];
        instance.address = '';
        instance.chainId = null;
        instance.connected = false;
        instance.name = 'no wallet';
        instance.hardwareWallet = false;
        instance._validChainIds = validChainIds;
    }

    async connect() {
        const installed = await this.isInstalled();
        if (installed) {
            this.connected = true;
        }
        return this.connected;
    }
    disconnect() {
        const instance = this;
        instance.accounts = [];
        instance.address = '';
        instance.chainId = null;
        instance.connected = false;
    }
    async sendTx() {}
    async switchToNetwork() {}
    async isInstalled() {
        false;
    }
    networkConnected() {
        return false;
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
