/**
 * Checks if browser supports (and enables) localStorage
 * Will return an Object that can store any type of data, including BigNumbers in the local Storage:
 *
 * {
 *     setSimpleType(key, value) // to store integer, string and boolean types
 *     getSimpleType(key)        // gets integer, string and boolean types
 *     setObject(key, value)     // stores any object type type, including Dates and BigNumbers
 *     getObject(key)            // gets any object type type, including Dates and BigNumbers
 * }
 *
 *  Will return undefined if the browser does not support localStorage
 *
 * <i>Copyright (c) 2020 ITSA - https://itsa.io</i><br>
 * Proprietary License
 *
 *
 * @module localStorage.js
 * @class LocalStorage
 * @since 0.7.10
 */

// see https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API

import jwt from 'jsonwebtoken';
import { isPlainObject, isDate } from 'lodash';
import { utils } from 'web3';
import toBN from '../toBN';

const { isBN } = utils;
const BN_IDENTIFIER = '##BN##';
const DATE_IDENTIFIER = '##DATE##';
const BN_IDENTIFIER_LENGTH = BN_IDENTIFIER.length;
const DATE_IDENTIFIER_LENGTH = DATE_IDENTIFIER.length;
const JWT_KEY = 'energi_jwt_47';

// eslint-disable-next-line import/no-mutable-exports
let customLocalStorage;

// eslint-disable-next-line func-names
(function (win) {
	let storage;

	const reviverComplex = value => {
		if (typeof value === 'string') {
			if (value.startsWith(BN_IDENTIFIER)) {
				return toBN(value.substr(BN_IDENTIFIER_LENGTH));
			}
			if (value.startsWith(DATE_IDENTIFIER)) {
				return new Date(value.substr(DATE_IDENTIFIER_LENGTH));
			}
		}
		return value;
	};

	const replacerComplex = value => {
		if (isBN(value)) {
			return BN_IDENTIFIER + value.toString();
		}
		if (isDate(value)) {
			return DATE_IDENTIFIER + value.toISOString();
		}
		return value;
	};

	const reviver = value => {
		let objectKeys;
		let newValue;

		if (isPlainObject(value)) {
			newValue = {};
			objectKeys = Object.keys(value);
			objectKeys.forEach(k => {
				newValue[k] = reviverComplex(value[k]);
			});
			return newValue;
		}
		return typeof value === 'string' && value.startsWith(BN_IDENTIFIER)
			? toBN(value.substr(BN_IDENTIFIER_LENGTH))
			: value;
	};

	const replacer = value => {
		let newValue;
		let objectKeys;

		if (isPlainObject(value)) {
			newValue = {};
			objectKeys = Object.keys(value);
			objectKeys.forEach(k => {
				newValue[k] = replacerComplex(value[k]);
			});
			return newValue;
		}
		return isBN(value) ? BN_IDENTIFIER + value.toString() : value;
	};

	const localStorageSupport = () => {
		try {
			const x = '__storage_test__';
			storage = win.localStorage;
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		} catch (e) {
			return (
				win.DOMException &&
				e instanceof win.DOMException &&
				// everything except Firefox
				(e.code === 22 ||
					// Firefox
					e.code === 1014 ||
					// test name field too, because code might not be present
					// everything except Firefox
					e.name === 'QuotaExceededError' ||
					// Firefox
					e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
				// acknowledge QuotaExceededError only if there's something already stored
				storage &&
				storage.length !== 0
			);
		}
	};

	if (localStorageSupport()) {
		// modify localstorage, so that we can store non simple types of data
		customLocalStorage = {
			setSimpleType(key, value, encoded) {
				// store as a JSON object, so we don't need to bother converting types:
				const val = {};

				val[key] = value;
				this.setObject(key, val, encoded);
			},
			getSimpleType(key, encoded) {
				// stored as a JSON object, so we don't need to bother converting types:
				const val = this.getObject(key, encoded);
				return val && val[key];
			},
			remove(key) {
				storage.removeItem(key);
			},
			setObject(key, value, encoded) {
				let v;
				let objectKeys;
				let newValue;

				try {
					if (Array.isArray(value)) {
						value = value.map(replacer);
					} else if (isPlainObject(value)) {
						newValue = {};
						objectKeys = Object.keys(value);
						objectKeys.forEach(k => {
							newValue[k] = replacerComplex(value[k]);
						});
						value = newValue;
					} else {
						value = replacerComplex(value);
					}
					v = encoded
						? jwt.sign({ jwtObject: value }, JWT_KEY, { noTimestamp: true })
						: JSON.stringify(value); // also replacer for direct BN storage
					storage.setItem(key, v);
				} catch (err) {
					// eslint-disable-next-line no-console
					console.error(err);
				}
			},
			getObject(key, encoded) {
				let value;
				let v;
				let objectKeys;
				let newValue;
				let jwtEncoded;

				try {
					v = storage.getItem(key);
					if (v) {
						if (encoded) {
							jwtEncoded = jwt.decode(v);
							value = jwtEncoded.jwtObject;
						} else {
							value = JSON.parse(v);
						}
						if (Array.isArray(value)) {
							value = value.map(reviver);
						} else if (isPlainObject(value)) {
							newValue = {};
							objectKeys = Object.keys(value);
							objectKeys.forEach(k => {
								newValue[k] = reviverComplex(value[k]);
							});
							value = newValue;
						} else {
							value = reviverComplex(value);
						}
					}
				} catch (err) {
					// eslint-disable-next-line no-console
					console.error(err);
				}
				return value;
			},
		};
	}
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default customLocalStorage;
