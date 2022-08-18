import createStore from 'ctx-provider';
import { useState, useEffect, useReducer, useRef } from 'react';
import { localStorageProperty } from '@itsa.io/web3utils';
import WalletClass from './helpers/wallet-class';
import LedgerWallet from './wallets/ledger';
import BraveWallet from './wallets/brave';
import MetamaskWallet from './wallets/metamask';

const NOOP = () => {};

const SUPPORTED_WALLETS = [
	'ledger',
	'brave',
	'metamask',
];

const lsConnectedWallet = localStorageProperty('walletconnectbutton', {
	simpleType: true, // we use a boolean
});

// hooks always need to be a function:
const useWalletConnection = ({supportedWallets = SUPPORTED_WALLETS, validChainIds = []}) => {
	const getLib = (libname) => {
		if (libname === 'ledger') {
			return ledgerWallet.current;
		}
		if (libname === 'brave') {
			return braveWallet.current;
		}
		if (libname === 'metamask') {
			return metamaskWallet.current;
		}
		return noWallet.current;
	};
	const [wallet, setWalletInternal] = useState(lsConnectedWallet.get() || '');
	const noWallet = useRef(new WalletClass());
	const ledgerWallet = useRef(new LedgerWallet(validChainIds));
	const braveWallet = useRef(new BraveWallet(validChainIds));
	const metamaskWallet = useRef(new MetamaskWallet(validChainIds));
	const [lib, setLib] = useState(getLib(wallet));
	const [initialized, setInitialized] = useState(false);
	const [_, forceUpdate] = useReducer((x) => x + 1, 0);

	const tryUseWallet = async (startup) => {
		let connectSuccess;
		if (lib) {
			connectSuccess = await lib.connect(startup);
		}
		if (startup) {
			setInitialized(true);
		} else if (lib) {
			lsConnectedWallet.set(lib.hardwareWallet ? '' : lib.name); // not save user is using hardwarewallet: next time they need to select manually
		}
		if (!connectSuccess) {
			disconnect();
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
		hardwareWallet: lib.hardwareWallet, // boolean
		accounts: lib.accounts, // [string]
		address: lib.address, // string
		chainId: lib.chainId, // number
		connect: lib.connect.bind(lib), // function
		connected: lib.connected, // boolean
		networkConnected: lib.networkConnected(),
		disconnect, // function
		installed: lib.installed, // boolean
		sendTx: lib.sendTx.bind(lib), // function
		switchToNetwork: lib.switchToNetwork.bind(lib), // function
		attachHardwareDevice: lib.attachDevice ? lib.attachDevice.bind(lib) : NOOP, // function
		setSelectHardwareDeviceFn: lib.setSelectDeviceFn ? lib.setSelectDeviceFn.bind(lib) : NOOP,
		setMessageListenerFn: lib.setMessageListenerFn ? lib.setMessageListenerFn.bind(lib) : NOOP,
		switchToAddress: lib.switchToAddress ? lib.switchToAddress.bind(lib) : NOOP,
		getHardwareDeviceName: lib.getDeviceName ? lib.getDeviceName.bind(lib) : NOOP,
		appSelected: lib.appSelected ? lib.appSelected.bind(lib) : NOOP,
	};
};

const store = createStore(useWalletConnection);

export const { Provider } = store;
export default store.ctx;
