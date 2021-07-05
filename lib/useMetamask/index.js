/* eslint-disable func-names */
/* eslint-disable import/no-extraneous-dependencies */
import { useState, useRef, useEffect } from 'react';
import libMetamask from './lib-metamask';
import localStorageInstance from '../localStorage';

// hooks always need to be a function:
const useMetamask = () => {
	const accounts = useRef();
	const address = useRef();
	const chainId = useRef();
	const connected = useRef();
	const installed = useRef();
	const timerRef = useRef();
	const forceUpdateRef = useRef(false);
	const [, setUpdate] = useState();

	const refresh = async forceConnect => {
		if (forceConnect) {
			await libMetamask.connect();
		}
		let updated = false;
		const mmAccounts = await libMetamask.getAccounts();
		const mmAddress = await libMetamask.getAddress();
		const mmChainId = await libMetamask.getChainId();
		const mmConnected = await libMetamask.isConnected();
		const mmInstalled = await libMetamask.isInstalled();

		if (accounts.current !== mmAccounts) {
			accounts.current = mmAccounts;
			updated = true;
		}
		if (address.current !== mmAddress) {
			address.current = mmAddress;
			updated = true;
		}
		if (chainId.current !== mmChainId) {
			chainId.current = mmChainId;
			updated = true;
		}
		if (connected.current !== mmConnected) {
			connected.current = mmConnected;
			updated = true;
		}
		if (installed.current !== mmInstalled) {
			installed.current = mmInstalled;
			updated = true;
		}
		if (updated) {
			// force state update
			forceUpdateRef.current = !forceUpdateRef.current;
			setUpdate(forceUpdateRef.current);
		}
	};

	const initRefresh = () => {
		refresh(localStorageInstance.getSimpleType('walletConnected'));
		timerRef.current = setInterval(refresh, 500);
	};

	useEffect(() => {
		initRefresh();
		return () => {
			clearInterval(timerRef.current);
		};
	}, []);

	const connect = async () => {
		await libMetamask.connect();
		localStorageInstance.setSimpleType('walletConnected', true);
		refresh();
	};

	const disconnect = async () => {
		await libMetamask.disconnect();
		localStorageInstance.setSimpleType('walletConnected', false);
		refresh();
	};

	return {
		accounts: accounts.current, // state: [string]
		address: address.current, // state: string
		chainId: chainId.current, // state: string
		connect, // function
		connected: connected.current, // state: boolean
		disconnect, // function
		installed: installed.current, // state: boolean
		sendTx: libMetamask.sendTx, // function
		switchToNetwork: libMetamask.switchToNetwork, // function
	};
};

export default useMetamask;
