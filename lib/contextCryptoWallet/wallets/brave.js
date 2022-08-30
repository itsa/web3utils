import { delay } from '../../timers';
import managedPromise from '../../managedPromise';
import MetaMaskWallet from './metamask';
import { cloneDeep, isEqual } from 'lodash';

const CONNECT_TIMEOUT_SEC = 1;

class BraveWallet extends MetaMaskWallet {
    constructor() {
        super();
        this.name = 'brave';
    }

    deactivate(keepPolling) {
        const instance = this;
        if (!keepPolling) {
            delete instance._polling;
        }
        super.deactivate();
    }

    async activate() {
        const instance = this;
        super.deactivate(); // deactivate polling
        instance._eventListenersSet = true; // prevent super.activate() to set up eventlisteners, because on Brave they don't work properly atm
        try {
            await super.activate(CONNECT_TIMEOUT_SEC);
        }
        catch(err) {
        }
        instance.pollWalletConnection();
        // because we need to keep polling: we don't want the parent file (index) to disconnect
        return true;
    }

    async pollWalletConnection() {
        const instance = this;
        if (!instance._polling) {
            instance._polling = true;
            while (instance._polling) {
                await delay(1200);
                if (instance.activationPromise && instance.activationPromise.isPending()) {
                    instance.activationPromise.reject();
                }
                instance._activationProps = {};
                instance.activationPromise = managedPromise();
                const prevAddress = instance.address;
                const prevChainId = instance.chainId;
                const prevAccounts = cloneDeep(instance.accounts);
                await instance._refresh('address', true);
                if (!instance.address) {
                    instance.deactivate(true);
                } else {
                    await instance._refresh('chainId', true);
                    await instance._refresh('accounts', true);
                }
                if (instance.activated && instance.activationPromise && instance.activationPromise.isFulfilled()) {
                    if ((prevAddress !== instance.address) || (prevChainId !== instance.chainId) || !isEqual(prevAccounts, instance.accounts)) {
                        instance.forceUpdateContext();
                    }
                }
            }
        }
    }
}

export default BraveWallet;
