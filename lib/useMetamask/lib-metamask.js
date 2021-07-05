/* eslint-disable consistent-return */
import Web3 from 'web3';
import isMobile from '../detectMobile';

// NOTE: NATIVE_MM_CHAIN cannot be used yet: wallet_switchEthereumChain is NOT YET part of MetaMask: https://ethereum-magicians.org/t/eip-3326-wallet-switchethereumchain/5471
const NATIVE_MM_CHAIN = {};
/*
const NATIVE_MM_CHAIN = {
	60: true,
	42: true,
};
*/
const networkDetails = {
	/*
	42: {
		chainId: '0x2a', // A 0x-prefixed hexadecimal chainId
		chainName: 'Kovan Ethereum Testnet',
		nativeCurrency: {
			name: 'Ethereum',
			symbol: 'ETH',
			decimals: 18,
		},
		rpcUrls: ['https://kovan.infura.io/v3/undefined'],
		blockExplorerUrls: ['https://kovan.etherscan.io'],
	},
	60: {
		chainId: '0x1', // A 0x-prefixed hexadecimal chainId
		chainName: 'Ethereum',
		nativeCurrency: {
			name: 'Ethereum',
			symbol: 'ETH',
			decimals: 18,
		},
		rpcUrls: ['https://mainnet.infura.io/v3/undefined'],
		blockExplorerUrls: ['https://etherscan.io'],
	},
*/
	49797: {
		chainId: '0xc285', // A 0x-prefixed hexadecimal chainId
		chainName: 'Energi Testnet',
		nativeCurrency: {
			name: 'Energi',
			symbol: 'tNRG',
			decimals: 18,
		},
		rpcUrls: ['https://nodeapi.test.energi.network'],
		blockExplorerUrls: ['https://explorer.test3.energi.network/'],
	},
	39797: {
		chainId: '0x9b75',
		chainName: 'Energi',
		nativeCurrency: {
			name: 'Energi',
			symbol: 'NRG',
			decimals: 18,
		},
		rpcUrls: ['https://nodeapi.energi.network'],
		blockExplorerUrls: ['https://explorer.energi.network/'],
	},
};

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
			if (!connectPromise) {
				return false;
			}
			return connectPromise.then(() => true).catch(() => false);
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
		getAccounts: async forceRefresh => {
			if (!(await metamask.isConnected())) {
				return;
			}
			return metamask.connect(forceRefresh);
		},
		sendTx: async rawTx => {
			const mm = await metamask.getMetaMask();
			if (!mm) {
				throw new Error('MetaMask is not installed');
			}

			// METAMASK may flash an empty form very quickly, this seems to be a known bug:
			// https://github.com/MetaMask/metamask-extension/issues/9345
			// still works fine
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
					'is not defined by @energi/utils',
				);
				return;
			}
			const mm = await metamask.getMetaMask();
			if (!mm) {
				throw new Error('MetaMask is not installed');
			}
			// NOTE: wallet_switchEthereumChain is NOT YET part of MetaMask: https://ethereum-magicians.org/t/eip-3326-wallet-switchethereumchain/5471
			return mm.request({
				method: NATIVE_MM_CHAIN[chainId]
					? 'wallet_switchEthereumChain'
					: 'wallet_addEthereumChain',
				params: [networkDetails[chainId]],
			});
		},
		disconnect: async () => {
			if (connectPromise) {
				await connectPromise;
			}
			connectPromise = null;
		},
		connect: async forceRefresh => {
			// never start a connection when another is currently pending!
			if (connectPromise && !forceRefresh) {
				return connectPromise;
			}
			const mm = await metamask.getMetaMask();
			connectPromise = mm.request({ method: 'eth_requestAccounts' });
			return connectPromise;
		},
	};
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default metamask;
