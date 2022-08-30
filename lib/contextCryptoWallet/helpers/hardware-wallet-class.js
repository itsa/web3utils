import Wallet from './wallet-class';

class HardwareWallet extends Wallet {
    constructor() {
        super();

        const instance = this;
        instance.hardwareWallet = true;
        instance.hardwareStatus = 0;
    }
    async attachDevice() {
    }
    async switchToAddress() {
    }
    setSelectDeviceFn() {
    }
    cancelReadHardwareAccounts() {
    }
    readHardwareAccounts() {
    }
    getAddressIndex() {
        const instance = this;
        if (!instance.address || !instance.accounts) {
            return -1;
        }
        return instance.accounts.indexOf(instance.address);
    }
}

export default HardwareWallet;
