import Wallet from '../helpers/wallet-class';
import libMetamask from '../helpers/lib-metamask';
import capFirstChar from '../helpers/capitalize-first-character';
import isNode from '../../isNode';
import { later, delay } from '../../timers';
import managedPromise from '../../managedPromise';
import { cloneDeep, isEqual } from 'lodash';

let MetaMaskWallet = Wallet;

const SIGNED = 'signed'; // signal that tx is signed
const DEFAULT_CONNECT_TIMEOUT_SEC = 300;
const WITH_METAMASK_ACCOUNTS = false; // not supported yet by metamask

if (!isNode) {
    // eslint-disable-next-line func-names
    (function (win) {
        class MetaMaskWindows extends Wallet {
            constructor(validChainIds, usePolling) {
                super(validChainIds);
                const instance = this;
                instance._refreshing = {};
                instance.name = 'metamask';
                instance._usePolling = usePolling;
            }

            _allPropsDefined(obj) {
                return !!obj.address && !!obj.chainId && !!obj.accounts;
            }

            _checkActivation(prop) {
                const instance = this;
                if (instance.activationPromise && instance.activationPromise.isPending()) {
                    instance._activationProps[prop] = true;
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
                    // we do not read accounts: MM is always returning an array with the active address as only value
                    // no need to overload MM
                    let value;
                    if (!WITH_METAMASK_ACCOUNTS && (prop === 'accounts')) {
                        value = instance.address ? [instance.address] : [];
                    } else {
                        value = await libMetamask[`get${capFirstChar(prop)}`]();
                    }

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
                        if (!WITH_METAMASK_ACCOUNTS && (prop === 'address')) {
                            instance.accounts = [value];
                        }
                        if (!initialization || instance.activated) {
                            instance.forceUpdateContext();
                        }
                        if (!WITH_METAMASK_ACCOUNTS && (prop === 'address')) {
                            instance._checkActivation('accounts');
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
                if (!instance.activationPromise) {
                    instance.activationPromise = managedPromise(null, null, timeoutSec * 1000, '');
                }
                await instance._refresh('address', true);
                while (!instance.address && instance.activationPromise.isPending()) {
                    await delay(2500);
                    await instance._refresh('address', true);
                }
                await instance._refresh('chainId', true);
                await instance._refresh('accounts', true);
            };

            deactivate(keepPolling) {
                const instance = this;
                if (instance._usePolling && !keepPolling) {
                    delete instance._polling;
                }
                if (instance.activationPromise) {
                    if (instance.activationPromise.isPending()) {
                        instance.activationPromise.reject();
                    }
                    delete instance.activationPromise;
                }
                instance._activationProps = {};
                super.deactivate();
            }

            cancelTimer() {
                if (this._timer) {
                    this._timer.cancel();
                }
            }

            async activate(timeoutSec = DEFAULT_CONNECT_TIMEOUT_SEC) {
                const instance = this;
                if (instance.activated) {
                    return true; // already connected
                }
                if (instance.activationPromise) {
                    return instance.activationPromise;
                }

                if (!instance._usePolling) {
                    const installed = await libMetamask.isInstalled();
                    if (!installed) {
                        instance.emitter.emit('info', 'Please install MetaMask');
                        return false;
                    }
                }
                instance._activationProps = {};
                instance.activationPromise = managedPromise(null, null, timeoutSec * 1000, '');
                if (!instance._usePolling && !instance._eventListenersSet) {
                    const mm = await libMetamask.getMetaMask();
                    if (mm) {
                        instance._eventListenersSet = true;
                        mm.on('connect', () => {
                            instance.cancelTimer();
                            instance._onConnect(timeoutSec);
                        });
                        mm.on('disconnect', () => {
                            // we MAY need to deactivate, but not when a quick `connect` follows
                            // because, sometimes when changing from network, a quick disconnect+connect happen (not always)
                            // and when it does, disconnecting would bring some apps into a disconnected state
                            instance.cancelTimer();
                            instance._timer = later(instance.deactivate.bind(instance), 1000);

                        });
                        mm.on('chainChanged', instance._refresh.bind(instance, 'chainId', false));
                        mm.on('accountsChanged', () => {
                            instance._refresh('address');
                            instance._refresh('accounts');
                        });
                    }
                }
                if (instance._usePolling) {
                    instance.pollWalletConnection();
                } else {
                    try {
                        Promise.all([
                            instance._refresh('address', true),
                            instance._refresh('accounts', true),
                            instance._refresh('chainId', true),
                        ]);
                    }
                    catch (err) {
                        instance.emitter.emit('info', 'Please install MetaMask');
                        return false;
                    }
                }
                return instance.activationPromise;
            }

            networkConnected() {
                const instance = this;
                return instance.activated && (!instance._validChainIds || instance._validChainIds.includes(instance.chainId));
            }

            async sendTx(rawTx) {
                let response;
                const instance = this;
                const EVENT_SIGN_TRANSACTION = `Please sign your Transaction on your ${capFirstChar(instance.name)} Wallet`;
                try {
                    instance.emitter.emit('info', EVENT_SIGN_TRANSACTION, true);
                    response = await libMetamask.sendTx(rawTx);
                    instance.emitter.emit('cleanup', EVENT_SIGN_TRANSACTION);
                    if (response) {
                        instance.emitter.emit(SIGNED, SIGNED); // code for being signed
                    }
                }
                catch(err) {
                    instance.emitter.emit('cleanup', EVENT_SIGN_TRANSACTION);
                    throw new Error((err.code === 4100) ? 'Cannot send transaction: please unlock your Wallet first' : err.message);
                }
                return response;
            }

            async switchToNetwork(networkId) {
                return libMetamask.switchToNetwork(networkId);
            }

            async pollWalletConnection() {
                const instance = this;
                if (instance._usePolling && !instance._polling) {
                    instance._polling = true;
                    let firstLoop = true;
                    let hasErrored = false;
                    while (instance._polling) {
                        const prevAddress = instance.address;
                        const prevChainId = instance.chainId;
                        const prevAccounts = cloneDeep(instance.accounts);
                        try {
                            if (firstLoop) {
                                firstLoop = false;
                                await Promise.all([
                                    instance._refresh('address', true),
                                    instance._refresh('accounts', true),
                                    instance._refresh('chainId', true),
                                ]);
                                if (instance.activated && !instance.address) {
                                    instance.deactivate(true);
                                }
                            } else {
                                await instance._refresh('address');
                                if (instance.activated && !instance.address) {
                                    instance.deactivate(true);
                                } else {
                                    await instance._refresh('chainId');
                                    await instance._refresh('accounts');
                                }
                            }
                            hasErrored = false; // reset
                        }
                        catch (err) {
                            if (!hasErrored) {
                                hasErrored = true;
                                instance.emitter.emit('info', 'Please install MetaMask');
                            }
                        }
                        if (instance.activated && instance.activationPromise && instance.activationPromise.isFulfilled()) {
                            if ((prevAddress !== instance.address) || (prevChainId !== instance.chainId) || !isEqual(prevAccounts, instance.accounts)) {
                                instance.forceUpdateContext();
                            }
                        }
                        await delay(1200);
                    }
                }
            }
        }

        MetaMaskWallet = MetaMaskWindows;
    })(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);
}

export default MetaMaskWallet;
