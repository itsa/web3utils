import Wallet from '../helpers/wallet-class';

class Ledger extends Wallet {
    constructor() {
        super();
        const instance = this;
        instance.name = 'ledger';
    }

}

export default Ledger;
