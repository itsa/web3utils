/* eslint-disable no-unused-expressions */
/* eslint-disable func-names */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */

// NOTE: setTimeout can be up to 2147483647 milliseconds (the max for 32 bit integer: about 24 days
const TIMEOUT_MAX = process.env.NODE_ENV === 'test' ? 400 : 2147483647; // 2^31-1

/**
 * Forces a function to be run asynchronously, but as fast as possible. In Node.js
 * this is achieved using `setImmediate` or `process.nextTick`.
 *
 * @method _asynchronizer
 * @param callbackFn {Function} The function to call asynchronously
 * @static
 * @private
 */
const _asynchronizer =
	typeof setImmediate !== 'undefined'
		? function (fn) {
				setImmediate(fn);
		  }
		: typeof process !== 'undefined' && process.nextTick
		? process.nextTick
		: function (fn) {
				setTimeout(fn, 0);
		  };

/**
 * Invokes the callbackFn once in the next turn of the JavaScript event loop. If the function
 * requires a specific execution context or arguments, wrap it with Function.bind.
 *
 * async returns an object with a cancel method.  If the cancel method is
 * called before the callback function, the callback function won't be called.
 *
 * @method async
 * @param {Function} callbackFn
 * @return {Object} An object with a cancel method.  If the cancel method is
 * called before the callback function, the callback function won"t be called.
 */
const _async = function (callbackFn) {
	let canceled;

	typeof callbackFn === 'function' &&
		_asynchronizer(function () {
			if (!canceled) {
				callbackFn();
			}
		});

	return {
		cancel() {
			canceled = true;
		},
	};
};

const _setLongTimeout = function (cb, timeout) {
	if (timeout <= TIMEOUT_MAX) {
		return setTimeout(cb, timeout);
	}
	// else: use a long timeout by reuse the remaining the timeout
	return setTimeout(
		_setLongTimeout.bind(null, cb, TIMEOUT_MAX - timeout),
		timeout,
	);
};

/**
 * Invokes the callbackFn after a timeout (asynchronous). If the function
 * requires a specific execution context or arguments, wrap it with Function.bind.
 *
 * To invoke the callback function periodic, set "periodic" either "true", or specify a second timeout.
 * If number, then periodic is considered "true" but with a perdiod defined by "periodic",
 * which means: the first timer executes after "timeout" and next timers after "period".
 *
 * I.later returns an object with a cancel method.  If the cancel() method is
 * called before the callback function, the callback function won"t be called.
 *
 * @method later
 * @param callbackFn {Function} the function to execute.
 * @param [timeout] {Number} the number of milliseconds to wait until the callbackFn is executed.
 * when not set, the callback function is invoked once in the next turn of the JavaScript event loop.
 * @param [periodic] {boolean|Number} if true, executes continuously at supplied, if number, then periodic is considered "true" but with a perdiod
 * defined by "periodic", which means: the first timer executes after "timeout" and next timers after "period".
 * The interval executes until canceled.
 * @return {object} a timer object. Call the cancel() method on this object to stop the timer.
 */
const later = function (callbackFn, timeout, periodic) {
	let canceled = false;
	let id;
	if (typeof timeout !== 'number') {
		return _async(callbackFn);
	}
	const wrapper = function () {
		// nodejs may execute a callback, so in order to preserve
		// the cancel() === no more runny-run, we have to build in an extra conditional
		if (!canceled) {
			callbackFn();
			// we are NOT using setInterval, because that leads to problems when the callback
			// lasts longer than the interval. Instead, we use the interval as inbetween-phase
			// between the separate callbacks.
			id = periodic
				? _setLongTimeout(
						wrapper,
						typeof periodic === 'number' ? periodic : timeout,
				  )
				: null;
		}
	};
	typeof callbackFn === 'function' && (id = _setLongTimeout(wrapper, timeout));

	return {
		cancel() {
			canceled = true;
			id && clearTimeout(id);
			// break closure:
			id = null;
		},
	};
};

/**
 * Creates an synchronous delay: returns a Promise
 *
 * @example
 *
 *     var delay = require("itsa-utils").delay;
 *
 *     var someFn = async () => {
 *         await delay(1000);
 *         // code here executes after 1 second delay
 *     }
 *
 * @method delay
 * @param [timeout=0] {Number} ms to delay.
 * @return {Promise} A Promise which will fulfill after the ms set in the first argument.
 */
const delay = function (ms) {
	ms || (ms = 0);
	return new Promise(function (fulfill) {
		later(fulfill, ms);
	});
};

exports.async = _async;
exports.later = later;
exports.delay = delay;
