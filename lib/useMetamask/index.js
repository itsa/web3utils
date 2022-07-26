/* eslint-disable func-names */
/* eslint-disable import/no-extraneous-dependencies */
import { useState, useEffect } from 'react';
import { isEqual } from 'lodash';
import libMetamask from './lib-metamask';
import localStorageInstance from '../localStorage';

const subscriptions = [];

const subscribe = effects => subscriptions.push(effects);

const unsubscribe = effects => {
	const index = subscriptions.indexOf(effects);
	if (index !== -1) {
		subscriptions.splice(index, 1);
	}
};

let mmAccounts;
let mmAddress;
let mmChainId;
let mmConnected;
let mmInstalled;

const refresh = async () => {
	try {
		mmAccounts = await libMetamask.getAccounts();
		mmAddress = await libMetamask.getAddress();
		mmChainId = await libMetamask.getChainId();
		mmConnected = await libMetamask.isConnected();
		mmInstalled = await libMetamask.isInstalled();

		subscriptions.forEach((effects, current) => {
			const { setAccounts, setAddress, setChainId, setConnected, setInstalled } = effects;
			const { accounts = [], address, chainId, connected, installed } = current;
			if (!isEqual(accounts, mmAccounts)) {
				setAccounts(mmAccounts);
			}
			if (address !== mmAddress) {
				setAddress(mmAddress);
			}
			if (chainId !== mmChainId) {
				setChainId(mmChainId);
			}
			if (connected !== mmConnected) {
				setConnected(mmConnected);
			}
			if (installed !== mmInstalled) {
				setInstalled(mmInstalled);
			}
		});
	}
	catch (err) {
		console.error(err);
	}
	// keep on polling MetaMask
	setTimeout(refresh, 500);
};

// poll MetaMask
setTimeout(refresh, 500);

// hooks always need to be a function:
const useMetamask = () => {
	const [accounts, setAccounts] = useState(mmAccounts);
	const [address, setAddress] = useState(mmAddress);
	const [chainId, setChainId] = useState(mmChainId);
	const [connected, setConnected] = useState(mmConnected);
	const [installed, setInstalled] = useState(mmInstalled);

	useEffect(() => {
		const effects = {
			setAccounts,
			setAddress,
			setChainId,
			setConnected,
			setInstalled,
		};
		const current = {
			accounts,
			address,
			chainId,
			connected,
			installed,
		};
		subscribe(effects, current);
		if (localStorageInstance && localStorageInstance.getSimpleType('walletConnected')) {
			libMetamask.connect();
		}
		return () => {
			unsubscribe(effects);
		};
	}, []);

	const connect = async () => {
		await libMetamask.connect();
		if (localStorageInstance) {
			localStorageInstance.setSimpleType('walletConnected', true);
		}
	};

	const disconnect = async () => {
		await libMetamask.disconnect();
		if (localStorageInstance) {
			localStorageInstance.setSimpleType('walletConnected', false);
		}
	};

	return {
		accounts, // state: [string]
		address, // state: string
		chainId, // state: number
		connect, // function
		connected, // state: boolean
		disconnect, // function
		installed, // state: boolean
		sendTx: libMetamask.sendTx, // function
		switchToNetwork: libMetamask.switchToNetwork, // function
	};
};

export default useMetamask;
