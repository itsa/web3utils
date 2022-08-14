/* eslint-disable consistent-return */
import Web3 from 'web3';
import isMobile from '../../detectMobile';
import { later } from '../../timers';
import networkDetails from './networks';

// eslint-disable-next-line import/no-mutable-exports
let metamask;

// eslint-disable-next-line func-names
(function (win) {
	let connectPromise;

	metamask = {
		isInstalled: () => {
			if (!isMobile) {
				return Promise.resolve(!!win.ethereum && win.ethereum.isMetaMask);
			}
			return new Promise(resolve => {
				const handleEthereumCheck = () => {
					resolve(!!win.ethereum && win.ethereum.isMetaMask);
				};

				if (win.addEventListener) {
					win.addEventListener('ethereum#initialized', handleEthereumCheck, {
						once: true,
					});
				}
				// If the event is not dispatched by the end of the timeout,
				// the user probably doesn't have MetaMask installed.
				setTimeout(handleEthereumCheck, 3000); // 3 seconds
			});
		},
		getMetaMask: async () => {
			const isInstalled = await metamask.isInstalled();
			return isInstalled && win.ethereum;
		},
		isConnected: async () => {
			return metamask.connect().then(val => !!val).catch(() => false);
		},
		getChainId: async () => {
			const mm = await metamask.getMetaMask();
			if (!mm) {
				return;
			}
			return Web3.utils.hexToNumber(mm.chainId);
		},
		getAddress: async () => {
			if (!(await metamask.isConnected())) {
				return;
			}
			const mm = await metamask.getMetaMask();
			return mm.selectedAddress;
		},
		getAccounts: async () => {
			if (!(await metamask.isConnected())) {
				return;
			}
			return metamask.connect();
		},
		sendTx: async (rawTx = {}) => {
			const mm = await metamask.getMetaMask();
			if (!mm) {
				throw new Error('MetaMask is not installed');
			}
			if (rawTx.gasLimit && !rawTx.gas) {
				rawTx.gas = rawTx.gasLimit;
			}
			delete rawTx.gasLimit; // cannot be used
			return mm.request({
				method: 'eth_sendTransaction',
				params: [rawTx],
			});
		},
		switchToNetwork: async chainId => {
			if (!networkDetails[chainId]) {
				// eslint-disable-next-line no-console
				console.debug(
					'useMetamask switchToNetwork -> chainId',
					chainId,
					'is not defined by @itsa.io/web3utils',
				);
				return;
			}
			const mm = await metamask.getMetaMask();
			if (!mm) {
				throw new Error('MetaMask is not installed');
			}
			try {
				await mm.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: networkDetails[chainId].chainId }],
				});
			} catch (switchError) {
				// This error code indicates that the chain has not been added to MetaMask.
				if (switchError.code === 4902) {
					return mm.request({
						method: 'wallet_addEthereumChain',
						params: [networkDetails[chainId]],
					});
				}
				// any other error will be rethrown
				throw new Error(switchError);
			}
		},
		disconnect: async () => {
			console.warn('useMetamask disconnect() is not supported anymore');
		},
		connect: async () => {
			// never start a connection when another is currently pending!
			let connectedValue;
			if (connectPromise) {
				return connectPromise;
			}
			try {
				const mm = await metamask.getMetaMask();
				connectPromise = new Promise(async (resolve, reject) => {
					try {
						later(() => {
							reject('MetaMask timeout');
						}, 2000);
						const response = await mm.request({ method: 'eth_requestAccounts' });
						resolve(response);
					}
					catch (err) {
						reject(err);
					}
				});
				await connectPromise;
				connectedValue = connectPromise;
				connectPromise = null;
			}
			catch (err) {
				connectedValue = null;
				connectPromise = null;
			}
			return connectedValue;
		},
	};
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default metamask;
