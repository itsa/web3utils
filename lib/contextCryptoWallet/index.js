import createStore from 'ctx-provider';
import { useState, useEffect, useReducer, useRef } from 'react';
import helperWalletEvents from './helpers/wallet-events';
import localStorageProperty from '../localStorageProperty';
import isMobile from '../detectMobile';
import cryptowalletDetection from '../cryptowalletDetection';
import WalletClass from './helpers/wallet-class';
import LedgerWallet from './wallets/ledger';
import BraveWallet from './wallets/brave';
import MetamaskWallet from './wallets/metamask';

const NOOP = () => {};

const SUPPORTED_WALLETS = [
	'ledger',
	'ledgerbt',
	'brave',
	'metamask',
];

const lsConnectedWallet = localStorageProperty('walletconnectbutton', {
	simpleType: true, // we use a boolean
});

let walletClass;
let ledgerClass;
let ledgerBTClass;
let braveClass;
let metamaskClass;
let initialWallet;

const getWalletClass = (wallet, validChainIds) => {
	if (wallet === 'ledger') {
		if (!ledgerClass) {
			ledgerClass = new LedgerWallet(validChainIds);
		}
		return ledgerClass;
	}
	if (wallet === 'ledgerbt') {
		if (!ledgerBTClass) {
			ledgerBTClass = new LedgerWallet(validChainIds, true);
		}
		return ledgerBTClass;
	}
	if (wallet === 'brave') {
		if (!braveClass) {
			braveClass = new BraveWallet(validChainIds);
		}
		return braveClass;
	}
	if (wallet === 'metamask') {
		if (!metamaskClass) {
			metamaskClass = new MetamaskWallet(validChainIds);
		}
		return metamaskClass;
	}
	if (!walletClass) {
		walletClass = new WalletClass();
	}
	return walletClass;
};

const getInitialWallet = () => {
	if (!initialWallet) {
		if (isMobile) {
			if (cryptowalletDetection.isBrave) {
				initialWallet = 'brave';
			} else if (cryptowalletDetection.isMetaMask) {
				initialWallet = 'metamask';
			}
		}
		if (!initialWallet) {
			initialWallet = lsConnectedWallet.get() || '';
		}
	}
	return initialWallet;
};

// hooks always need to be a function:
const useWalletConnection = ({supportedWallets = SUPPORTED_WALLETS, validChainIds = []}) => {
	const getLib = (libname) => {
		if (libname === 'ledger') {
			return ledgerWallet.current;
		}
		if (libname === 'ledgerbt') {
			return ledgerBTWallet.current;
		}
		if (libname === 'brave') {
			return braveWallet.current;
		}
		if (libname === 'metamask') {
			return metamaskWallet.current;
		}
		return noWallet.current;
	};
	const [initialized, setInitialized] = useState(false);
	const [wallet, setWalletInternal] = useState(getInitialWallet());
	const noWallet = useRef(getWalletClass('none'));
	const ledgerWallet = useRef(getWalletClass('ledger', validChainIds));
	const ledgerBTWallet = useRef(getWalletClass('ledgerbt', validChainIds));
	const braveWallet = useRef(getWalletClass('brave', validChainIds));
	const metamaskWallet = useRef(getWalletClass('metamask', validChainIds));
	const [lib, setLib] = useState(getLib(wallet));
	const libInitializationPromises = useRef({});
	const [_, forceUpdate] = useReducer((x) => x + 1, 0);

	const tryUseWallet = async () => {
		let connectSuccess;
		if (lib) {
			try {
				lsConnectedWallet.set(lib.name);
				connectSuccess = await lib.activate();
				forceUpdate();
			}
			catch (err) {
				connectSuccess = false;
			}
		}
		if (!connectSuccess) {
			disconnect();
		}
	};

	const disconnect = () => {
		if (lib) {
			setInitialized(false);
			lib.deactivate();
		}
		setWalletInternal('');
		setLib(getLib(''));
	}

	const defineInitializedLib = (libname) => {
		if (libname === lib.name) {
			// is currentlib
			setInitialized(true);
		}
	}

	useEffect(() => {
		lib.onUpdate(forceUpdate);
		const libName = lib.name;
		if (!libInitializationPromises.current[libName]) {
			libInitializationPromises.current[libName] = lib.isInitialized();
		}
		if (libInitializationPromises.current[libName].isPending()) {
			libInitializationPromises.current[libName].then(() => {
				defineInitializedLib(libName);
			});
		} else {
			defineInitializedLib(libName);
		}
		tryUseWallet();
	}, [lib]);

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

	/*
	 * Description of wallet statusses:
	 *
	 * initialized: first time when all data is read (and the wallet is unlocked while doing so)
	 * connected: defines if a wallet is chosen (ledger, brave, metamask etc), but tells nothing about the status of the wallet
	 * locked: whether a wallet is locked: metamask and brave can be locked through the extension, ledger will autolock after some time.
	 *         a locked wallet cannot read its data
	 */
	return {
		initialized, // boolean
		activated: lib.activated, // boolean
		wallet, // string
		setWallet, // function
		hardwareWallet: lib.hardwareWallet, // boolean
		bluetooth: !!lib.bluetooth, // boolean
		accounts: lib.accounts, // [string]
		address: lib.address, // string
		chainId: lib.chainId, // number
		activate: lib.activate.bind(lib), // function
		connected: !!lib && lib.name !== 'no wallet', // boolean
		locked: lib.locked, // boolean
		networkConnected: lib.networkConnected(),
		disconnect, // function
		sendTx: lib.sendTx.bind(lib), // function
		switchToNetwork: lib.switchToNetwork.bind(lib), // function
		hardwareStatus: lib.hardwareStatus, // number
		hardwareAddressIndex: lib.getAddressIndex ? lib.getAddressIndex() : -1,
		// attachHardwareDevice: lib.attachDevice ? lib.attachDevice.bind(lib) : NOOP, // function
		readHardwareAccounts: lib.readHardwareAccounts ? lib.readHardwareAccounts.bind(lib) : NOOP, // function
		cancelReadHardwareAccounts: lib.cancelReadHardwareAccounts ? lib.cancelReadHardwareAccounts.bind(lib) : NOOP, // function
		setSelectHardwareDeviceFn: lib.setSelectDeviceFn ? lib.setSelectDeviceFn.bind(lib) : NOOP, // function
		switchToAddress: lib.switchToAddress ? lib.switchToAddress.bind(lib) : NOOP, // function
		getHardwareDeviceName: lib.getDeviceName ? lib.getDeviceName.bind(lib) : NOOP, // function
		appSelected: lib.appSelected ? lib.appSelected.bind(lib) : NOOP, // function
	};
};

const store = createStore(useWalletConnection);

export const walletEvents = helperWalletEvents;
export const { Provider } = store;
export default store.ctx;
