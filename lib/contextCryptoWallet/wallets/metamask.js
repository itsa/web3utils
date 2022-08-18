import Wallet from '../helpers/wallet-class';
import libMetamask from '../helpers/lib-metamask';
import isNode from '../../isNode';
import { later } from '../../timers';
import { isEqual } from 'lodash';

const METAMASK_POLLING_FIRST_TIME_DELAY = 250; // ms
const METAMASK_POLLING_INTERVAL = 1000; // ms

let MetaMask = Wallet;

if (!isNode) {
    // eslint-disable-next-line func-names
    (function (win) {
        class MetaMaskWindows extends Wallet {
            constructor(validChainIds) {
                super(validChainIds);
                const instance = this;
                this.refresh = this.refresh.bind(this);
                instance.name = 'metamask';
            }

            async isInstalled() {
                return libMetamask.isInstalled();
            }

            async refresh(force) {
                const instance = this;
                if (!force && (instance.locked || !instance.connected)) {
                    console.debug('cancel refresh');
                    return;
                }
                console.debug('refresh');
                instance.locked = true;
                try {
                    const mmAccounts = await libMetamask.getAccounts();
                    const mmAddress = await libMetamask.getAddress();
                    const mmChainId = await libMetamask.getChainId();
                    const mmConnected = await libMetamask.isConnected();
                    const mmInstalled = await libMetamask.isInstalled();
                    console.debug('mmChainId', mmChainId);
                    let changed = false;

                    if (!isEqual(instance.accounts, mmAccounts)) {
                        changed = true;
                        instance.accounts = mmAccounts;
                    }
                    if (instance.address !== mmAddress) {
                        changed = true;
                        instance.address = mmAddress;
                    }
                    if (instance.chainId !== mmChainId) {
                        changed = true;
                        instance.chainId = mmChainId;
                    }
                    if (instance.firstTimeRefresh || (instance.connected !== mmConnected)) {
                        changed = true;
                        instance.connected = mmConnected;
                        if (!instance.connected) {
                            instance.disconnect();
                        }
                    }
                    if (instance.installed !== mmInstalled) {
                        changed = true;
                        instance.installed = mmInstalled;
                        if (!instance.installed) {
                            instance.disconnect();
                        }
                    }
                    if (changed && instance.connected) {
                        instance.forceUpdateContext();
                    }
                }
                catch (err) {
                    console.error(err);
                }
                instance.firstTimeRefresh = false;
                // keep on polling MetaMask
                instance.locked = false;
            }

            async connect() {
                const instance = this;
                if (instance.connected) {
                    return; // already connected
                }
                const installed = await this.isInstalled();
                if (installed) {
                    const mm = await libMetamask.getMetaMask();
                    if (mm && !instance._eventListenersSet) {
                        instance._eventListenersSet = true;
                        mm.on('connect', instance.refresh);
                        mm.on('disconnect', instance.refresh);
                        mm.on('chainChanged', instance.refresh);
                        mm.on('accountsChanged', instance.refresh);
                    }
                    await instance.refresh(true);
                }
                return instance.connected;
            }

            networkConnected() {
                console.debug('CHECK', this._validChainIds, this.chainId);
                return !this._validChainIds || this._validChainIds.includes(this.chainId);
            }

            async sendTx(rawTx) {
                return libMetamask.sendTx(rawTx);
            }

            async switchToNetwork(networkId) {
                return libMetamask.switchToNetwork(networkId);
                instance.forceUpdateContext();
            }

        }

        MetaMask = MetaMaskWindows;
    })(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);
}

export default MetaMask;
