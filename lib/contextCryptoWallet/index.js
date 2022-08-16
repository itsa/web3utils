import createStore from 'ctx-provider';
import { useState, useEffect, useReducer } from 'react';
import { localStorageProperty } from '@itsa.io/web3utils';
import WalletClass from './helpers/wallet-class';
import LedgerWallet from './wallets/ledger';
import BraveWallet from './wallets/brave';
import MetamaskWallet from './wallets/metamask';

const SUPPORTED_WALLETS = [
	'ledger',
	'brave',
	'metamask',
];

const lsConnectedWallet = localStorageProperty('walletconnectbutton', {
	simpleType: true, // we use a boolean
});

const noWallet = new WalletClass(); // have at least the correct properties and functions
const ledgerWallet = new LedgerWallet();
const braveWallet = new BraveWallet();
const metamaskWallet = new MetamaskWallet();

const getLib = (libname) => {
	if (libname === 'ledger') {
		return ledgerWallet;
	}
	if (libname === 'brave') {
		return braveWallet;
	}
	if (libname === 'metamask') {
		return metamaskWallet;
	}
	return noWallet;
};

// hooks always need to be a function:
const useWalletConnection = (supportedWallets = SUPPORTED_WALLETS) => {
	const [wallet, setWalletInternal] = useState(lsConnectedWallet.get() || '');
	const [lib, setLib] = useState(getLib(wallet));
	const [initialized, setInitialized] = useState(false);
	const [_, forceUpdate] = useReducer((x) => x + 1, 0);

	const tryUseWallet = async (startup) => {
		if (lib) {
			await lib.connect();
		}
		if (startup) {
			setInitialized(true);
		} else if (lib) {
			lsConnectedWallet.set(lib.name);
		}
	};

	const disconnect = () => {
		if (lib && lib.connected) {
			lib.disconnect();
		}
		setWalletInternal('');
		setLib(getLib(''));
	}

	useEffect(() => {
		tryUseWallet();
		lib.onUpdate(forceUpdate);
	}, [lib]);

	useEffect(() => {
		tryUseWallet(true);
	}, []);

	const setWallet = newWallet => {
		if (supportedWallets.includes(newWallet)) {
			setWalletInternal(newWallet);
			lsConnectedWallet.set(newWallet);
			if (lib && lib.connected) {
				lib.disconnect();
			}
			setLib(getLib(newWallet));
		}
	};

	return {
		initialized,
		wallet, // string
		setWallet, // function
		accounts: lib.accounts, // [string]
		address: lib.address, // string
		chainId: lib.chainId, // number
		connect: lib.connect.bind(lib), // function
		connected: lib.connected, // boolean
		disconnect, // function
		installed: lib.installed, // boolean
		sendTx: lib.sendTx.bind(lib), // function
		switchToNetwork: lib.switchToNetwork.bind(lib), // function
	};
};

const store = createStore(useWalletConnection);

export const { Provider } = store;
export default store.ctx;
