import Cookies from 'js-cookie';

/**
 * @typedef CookieOptions
 * @type {object}
 * @property {number|Date} expires When the cookie will be removed in days
 * @property {string} path The path where the cookie is visible
 * @property {string} domain The domain where the cookie is visible
 * @property {boolean} secure If the cookie transmission requires a secure protocol (https)
 * @property {string} sameSite Allow control whether the browser is sending a cookie along with cross-site requests
 */

/**
 * Assigns a property to a class instance which is synced to the users browser as a cookie on read/write.
 * @param {string} key Key to assign to object
 * @param {CookieOptions} opts Options passed to js-cookie
 */
const cookieProperty = (key, opts) => {
	let value;

	return {
		get() {
			if (!value) {
				value = Cookies.get(key);
			}
			return value;
		},
		set(newValue) {
			Cookies.set(key, newValue, opts);
			value = newValue;
		},
	};
};

export default cookieProperty;
