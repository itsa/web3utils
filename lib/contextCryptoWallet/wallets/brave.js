import { delay } from '../../timers';
import managedPromise from '../../managedPromise';
import MetaMaskWallet from './metamask';
import { cloneDeep, isEqual } from 'lodash';

const CONNECT_TIMEOUT_SEC = 1;

class BraveWallet extends MetaMaskWallet {
    constructor(validChainIds) {
        // use polling, because on Brave events don't work properly atm
        super(validChainIds, true);
        this.name = 'brave';
    }
}

export default BraveWallet;
