import { utils } from 'web3';

const bigNumbers = new Map();
const TIMERS = {}; // object to track cleanup timers
const MEM_TIME_MS = 120 * 1000; // time to keep memoized formatBN functions. 2 minutes: this way refresh ocuuring during changes of blockheights will benefit the cache

/**
 * Sets or resets a timer to cleanup a BigNumber instance from the Map.
 *
 * @function timerCleanup
 * @private
 * @param {string | number} arg - the argument to instantiate a BigNumber
 * @since 0.0.8
 */
const timerCleanup = arg => {
	const timeoutID = TIMERS[arg];
	if (timeoutID) {
		clearTimeout(timeoutID);
	}
	TIMERS[arg] = setTimeout(() => {
		clearTimeout(TIMERS[arg]);
		delete TIMERS[arg];
		bigNumbers.delete(arg);
	}, MEM_TIME_MS);
};

/**
 * Creates a new BigNumber instance and put it to a Map.
 * If the BigNumber already exists in the Map, it wil use this instance.
 * Instances remain 2 minutes in the Map after last time beging refered to.
 *
 * @function toBN
 * @param {string | number} arg - the argument to instantiate a BigNumber
 * @since 0.0.8
 */
const toBN = arg => {
	let bigNumber = bigNumbers.get(arg);
	if (!bigNumber) {
		bigNumber = utils.toBN(arg);
		bigNumbers.set(arg, bigNumber);
	}
	timerCleanup(arg);
	return bigNumber;
};

/**
 * Cleans up the toBN cache.
 *
 * @function cleanCacheToBN
 * @since 0.0.8
 */
export function cleanCacheToBN() {
	Object.keys(TIMERS).forEach(k => {
		clearTimeout(TIMERS[k]);
		delete TIMERS[k];
		bigNumbers.delete(k);
	});
}

export default toBN;
