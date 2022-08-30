import Wallet from '../helpers/wallet-class';
import libMetamask from '../helpers/lib-metamask';
import capFirstChar from '../helpers/capitalize-first-character';
import isNode from '../../isNode';
import { delay } from '../../timers';
import managedPromise from '../../managedPromise';
import { cloneDeep, isEqual } from 'lodash';

let MetaMaskWallet = Wallet;

const DEFAULT_CONNECT_TIMEOUT_SEC = 300;

if (!isNode) {
    // eslint-disable-next-line func-names
    (function (win) {
        class MetaMaskWindows extends Wallet {
            constructor(validChainIds) {
                super(validChainIds);
                const instance = this;
                instance._refreshing = {};
                instance.name = 'metamask';
            }

            _allPropsDefined(obj) {
                return !!obj.address && !!obj.chainId && !!obj.accounts;
            }

            _checkActivation(prop) {
                const instance = this;
                // console.debug('MM _checkActivation', prop, instance.activationPromise.isPending(), instance._activationProps);
                if (instance.activationPromise.isPending()) {
                    instance._activationProps[prop] = true;
                    // console.debug('_allPropsDefined', instance._allPropsDefined(instance._activationProps), instance._activationProps);
                    if (instance._allPropsDefined(instance._activationProps)) {
                        if (instance.initializationPromise.isPending()) {
                            instance.initializationPromise.fulfill(true);
                            instance.forceUpdateContext();
                        }
                        instance.activationPromise.fulfill(true);
                        instance.activated = true;
                    }
                }
            }

            async _refresh(prop, initialization) {
                const instance = this;
                if (!initialization && instance._refreshing[prop]) {
                    return;
                }
                instance._refreshing[prop] = true;
                try {
                    const value = await libMetamask[`get${capFirstChar(prop)}`]();
                    instance.locked = !value;
                    if (instance.locked) {
                        // willBeLocked: keep on using the data is it was before
                        instance._refreshing[prop] = false;
                        return;
                    }

                    const simpleType = prop !== 'accounts';
                    const propChanged = simpleType ? instance[prop] !== value : !isEqual(instance[prop], value);
                    if (propChanged) {
                        instance[prop] = simpleType ? value : cloneDeep(value);
                        if (!initialization || instance.activated) {
                            instance.forceUpdateContext();
                        }
                    }

                    instance._checkActivation(prop);
                }
                catch (err) {
                    console.error(err);
                }
                instance._refreshing[prop] = false;
            }

            async _onConnect(timeoutSec) {
                const instance = this;
                // cleanup previous
                await instance.deactivate();
                instance.activationPromise = managedPromise(null, null, timeoutSec * 1000, '');
                await instance._refresh('address', true);
                while (!instance.address && instance.activationPromise.isPending()) {
                    await delay(2500);
                    await instance._refresh('address', true);
                }
                await instance._refresh('chainId', true);
                await instance._refresh('accounts', true);
            };

            deactivate() {
                const instance = this;
                if (instance.activationPromise) {
                    if (instance.activationPromise.isPending()) {
                        instance.activationPromise.reject();
                    }
                    delete instance.activationPromise;
                }
                instance._activationProps = {};
                super.deactivate();
            }

            async activate(timeoutSec = DEFAULT_CONNECT_TIMEOUT_SEC) {
                const instance = this;
                if (instance.activated) {
                    return true; // already connected
                }
                if (instance.activationPromise) {
                    // await instance.refresh(true);
                    return instance.activationPromise;
                }

                const installed = await libMetamask.isInstalled();
                if (!installed) {
                    instance.emit('Please install MetaMask');
                    return false;
                }
                instance._activationProps = {};
                instance.activationPromise = managedPromise(null, null, timeoutSec * 1000, '');
                const mm = await libMetamask.getMetaMask();
                if (mm && !instance._eventListenersSet) {
                    instance._eventListenersSet = true;
                    mm.on('connect', instance._onConnect.bind(instance, timeoutSec));
                    mm.on('disconnect', instance.deactivate.bind(instance));
                    mm.on('chainChanged', instance._refresh.bind(instance, 'chainId', false));
                    mm.on('accountsChanged', () => {
                        instance._refresh('address');
                        instance._refresh('accounts');
                    });
                }
                await instance._refresh('address', true);
                await instance._refresh('accounts', true);
                await instance._refresh('chainId', true);
                return instance.activationPromise;
            }

            networkConnected() {
                const instance = this;
                return instance.activated && (!instance._validChainIds || instance._validChainIds.includes(instance.chainId));
            }

            async sendTx(rawTx) {
                let response;
                try {
                    response = await libMetamask.sendTx(rawTx);
                }
                catch(err) {
                    throw new Error((err.code === 4100) ? 'Cannot send transaction: please unlock your Wallet first' : err.message);
                }
                return response;
            }

            async switchToNetwork(networkId) {
                return libMetamask.switchToNetwork(networkId);
            }
        }

        MetaMaskWallet = MetaMaskWindows;
    })(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);
}

export default MetaMaskWallet;
