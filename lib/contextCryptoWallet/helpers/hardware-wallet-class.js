import Wallet from './wallet-class';

class HardwareWallet extends Wallet {
    constructor() {
        super();
        this.hardwareWallet = true;
    }

}

export default HardwareWallet;
