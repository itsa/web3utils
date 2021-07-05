import localStorage from '../localStorage';
import { cloneDeep } from 'lodash';

/**
 * Assigns a property to a class instance which is synced to the users browser as a cookie on read/write.
 * @param {Object} object Object instance to apply property to
 * @param {string} key Key to assign to object
 * @param {boolean} simpleType Defines if the value to be stored is a simple type or an object structure
 */
const localStorageProperty = (
	key,
	{ simpleType = false, encoded = true } = {},
) => {
	let value;

	return {
		get() {
			if ((value === undefined) && localStorage) {
				if (simpleType) {
					value = localStorage.getSimpleType(key, encoded);
				} else {
					value = localStorage.getObject(key, encoded);
				}
			}
			return simpleType ? value : cloneDeep(value);
		},
		set(newValue) {
			if (!simpleType) {
                newValue = cloneDeep(newValue);
            }
			if (localStorage) {
				try {
					if (simpleType) {
						localStorage.setSimpleType(key, newValue, encoded);
					} else {
						localStorage.setObject(key, newValue, encoded);
					}
				} catch (err) {
					// eslint-disable-next-line no-console
					console.warn(err);
				}
			}
			value = newValue;
		},
	};
};

export default localStorageProperty;
