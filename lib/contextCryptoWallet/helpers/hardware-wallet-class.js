import Wallet from './wallet-class';

class HardwareWallet extends Wallet {
    constructor() {
        super();
        this.hardwareWallet = true;
    }
    async attachDevice() {
    }
    async switchToAddress() {
    }
    setSelectDeviceFn() {
    }
}

export default HardwareWallet;
