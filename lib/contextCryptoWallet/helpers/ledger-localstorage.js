import { cloneDeep } from 'lodash';
import localStorageProperty from '../../localStorageProperty';

const LEDGERWALLET_LOCALSTORAGE_PROPS = {
    devicename: true,
    address: true,
    accounts: true,
    chainId: true,
};

const DEFAULT_VALUES = {
    devicename: '',
    address: '',
    accounts: [],
    chainId: null,
};

const ledgerLocalStorage = ledgerwalletName => {

    const ledgerWallet = localStorageProperty(ledgerwalletName, {
        simpleType: false, // we use an object
    });

    const get = prop => {
        if (LEDGERWALLET_LOCALSTORAGE_PROPS[prop]) {
            const walletObject = ledgerWallet.get() || {};
            const returnValue = walletObject[prop] || DEFAULT_VALUES[prop];
            return Array.isArray(returnValue) ? cloneDeep(returnValue) : returnValue;
        }
    }

    const set = (prop, value) => {
        if (LEDGERWALLET_LOCALSTORAGE_PROPS[prop]) {
            const walletObject = ledgerWallet.get() || {};
            const val = Array.isArray(value) ? cloneDeep(value) : (value || '');
            walletObject[prop] = val;
            ledgerWallet.set(walletObject);
        }
    }

    const clear = prop => {
        set(prop, DEFAULT_VALUES[prop]);
    };

    const clearAll = () => {
        // start with setting to empty value: for some reason, a removed item in localstorage isn't removed untill the page refreshes(?)
        const properties = Object.keys(LEDGERWALLET_LOCALSTORAGE_PROPS);
        properties.forEach(prop => clear(prop));
        ledgerWallet.remove();
    };

    return {
        get,
        set,
        clear,
        clearAll,
    };
}

export default ledgerLocalStorage;
