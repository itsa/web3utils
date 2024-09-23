/* eslint-disable prefer-const */
// @ts-nocheck
/**
 * Module formats bignumber amounts (wei) into ETH amount, with decimal and thousands separator, internationalized.
 *
 *
 * <i>Copyright (c) 2020 ITSA - https://itsa.io</i><br>
 * Proprietary License
 *
 *
 * @module format-bn.js
 * @since 0.0.1
 */

import { utils } from 'web3';

const { toBN, isBN } = utils;

const REGEXP_REMOVE_TRAILING_ZEROS = /(\d+?)0+$/;
const REGEXP_ONLY_NUMBERS = /[^\d]/g;
const suffixes = ['K', 'M', 'B', 'T', 'P', 'E'];
const INTL = {}; // object to cache localized Intl instances
const MEMOIZATION = {}; // object to memoize formatBN function calls
const TIMERS = {}; // object to track cleanup timers
const MEM_TIME_MS = 120 * 1000; // time to keep memoized formatBN functions. 2 minutes: this way refresh ocuuring during changes of blockheights will benefit the cache

let defaultLocale;

// eslint-disable-next-line func-names
(function (win) {
	defaultLocale = win.navigator ? win.navigator.language : 'en-US';
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

/**
 * Returns an Intl object for a specific locale.
 * Creates maximum 1 instance per locale: uses internal cache.
 *
 * @function getIntl
 * @private
 * @param {string} locale - the locale to generate the Intl instance for
 * @return {object} Intl object for the locale
 * @since 0.0.8
 */
const getIntl = locale => {
	if (!INTL[locale]) {
		INTL[locale] = new Intl.NumberFormat(locale, {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		});
	}
	return INTL[locale];
};

/**
 * Memoizes a formattedBN and sets a timer to cleanup after 2 minutes.
 * If the second argument is undefined, the timer will be resetted.
 *
 * @function memoize
 * @private
 * @param {string} memoizeKey - the key
 * @param {string} [formattedBN] - value to be memoized
 * @since 0.0.8
 */
const memoize = (memoizeKey, formattedBN) => {
	const timeoutID = TIMERS[memoizeKey];
	if (timeoutID) {
		clearTimeout(timeoutID);
	}
	TIMERS[memoizeKey] = setTimeout(() => {
		clearTimeout(TIMERS[memoizeKey]);
		delete TIMERS[memoizeKey];
		delete MEMOIZATION[memoizeKey];
	}, MEM_TIME_MS);
	if (formattedBN) {
		MEMOIZATION[memoizeKey] = formattedBN;
	}
};

/**
 * Configuration object for formatBN
 * @typedef {object} BNoptions
 * @property {number} decimals - force the format to have specific number of decimals
 * @property {string} locale="en-US" - locale to format to: will effect comma's and dots
 * @property {number} minDigits - force the format to have minimal amount of digits
 * @property {boolean} onlySignificant - will ignore insignificant zero's
 * @property {boolean} withSuffix - will render with a suffix like "K" instead of rendering all digits
 * @property {number} assetDigits=0 - definition of hof may digits an asset has. Will lead into division of the output by 10^assetDigits

/**
 * Formats bignumber amounts (wei) into ETH amount, with decimal and thousands separator, internationalized.
 *
 * @function formatBN
 * @param {BigNumber} bigNumber - The amount to be formatted, in wei
 * @param {BNoptions} options - Configuration object
 * @return {String} The internationalized representation of the amount of ETH's
 * @since 0.0.2
 */
const formatBN = (bigNumber, options = {}) => {
	let bigN = isBN(bigNumber) ? bigNumber : toBN(bigNumber);
	let {
		decimals,
		locale = defaultLocale,
		minDigits,
		onlySignificant,
		withSuffix,
		withThousandSeparator = true,
		assetDigits = 0,
		formatHTML = false,
	} = options;
	let suffix = '';
	let length;
	let padding;
	let tier;
	let multiplyFactor;
	let stringNumber;
	let stringIntl;
	let numberString;
	let stringFraction;
	let stringIntlFormatted;
	let match;
	let formattedString;
	let digitcount;

	const isNegative = bigN.lt(toBN('0'));
	const memoizeKey = bigN.toString() + JSON.stringify(options);
	const memoized = MEMOIZATION[memoizeKey];

	if (memoized) {
		memoize(memoizeKey); // reset timer
		return memoized;
	}

	if (isNegative) {
		bigN = bigN.mul(toBN('-1'));
		// the negative sign will be re-added at the end
	}

	const intl = getIntl(locale);

	if (assetDigits < 0) {
		assetDigits = 0;
	}

	if (withSuffix) {
		length = bigN.toString().length;
		if (length >= assetDigits + 4) {
			tier = Math.ceil((length - assetDigits - 3) / 3);
			padding = toBN('1'.padEnd(3 * tier + 1, '0'));
			bigN = bigN.div(padding);
			suffix = suffixes[tier - 1] || suffixes[suffixes.length - 1];
		}
		if (formatHTML && suffix !== '') {
			suffix = `<span class="bn-suffix">${suffix}</span>`;
		}
	}

	if (decimals < 0) {
		decimals = 0;
	}

	if (typeof decimals !== 'number') {
		decimals = assetDigits;
		if (typeof onlySignificant !== 'boolean') {
			onlySignificant = true;
		}
	} else if (decimals < assetDigits) {
		multiplyFactor = toBN(10 ** (assetDigits - decimals));
		bigN = bigN.divRound(multiplyFactor).mul(multiplyFactor);
	} else if (decimals > assetDigits) {
		decimals = assetDigits;
	}
	stringNumber = bigN.toString();

	// make sure it has at least the first full digit:
	stringNumber = stringNumber.padStart(assetDigits + 1, '0');
	// eslint-disable-next-line prefer-const
	stringIntl = `${stringNumber.substr(
		0,
		stringNumber.length - assetDigits,
	)}.${stringNumber.substr(stringNumber.length - assetDigits, 1)}`;

	if (decimals !== 0) {
		stringFraction = stringNumber.substring(
			stringNumber.length - assetDigits,
			stringNumber.length - assetDigits + decimals,
		);
		if (onlySignificant) {
			match = stringFraction.match(REGEXP_REMOVE_TRAILING_ZEROS);
			if (match) {
				// eslint-disable-next-line prefer-destructuring
				stringFraction = match[1];
			}
			if (stringFraction === '0') {
				stringFraction = '';
			}
		}
		if (formatHTML && stringFraction !== '') {
			stringFraction = `<span class="bn-decimal">${stringFraction}</span>`;
		}
	} else {
		stringFraction = '';
	}

	stringIntlFormatted = intl.format(stringIntl);

	const decimalSeparator =
		stringFraction === ''
			? ''
			: stringIntlFormatted[stringIntlFormatted.length - 2];

	stringIntlFormatted = stringIntlFormatted.substr(
		0,
		stringIntlFormatted.length - 2,
	);

	if (!withThousandSeparator) {
		stringIntlFormatted = stringIntlFormatted.replace(REGEXP_ONLY_NUMBERS, '');
	}

	formattedString = stringIntlFormatted + decimalSeparator + stringFraction + suffix;

	if (typeof minDigits === 'number' && decimals < assetDigits) {
		// only if decimals < assetDigits we are able to increadse the minimal digits
		// recursion will only take place max 1 time
		numberString = formattedString.replace(REGEXP_ONLY_NUMBERS, '');
		digitcount = numberString.length;
		if (digitcount < minDigits) {
			formattedString = formatBN(bigNumber, {
				locale,
				decimals: decimals + minDigits - digitcount,
				onlySignificant: false,
				withSuffix,
				minDigits,
				assetDigits,
				withThousandSeparator,
				formatHTML,
			});
		}
	}

	if (isNegative) {
		formattedString = '-' + formattedString;
		// re-add the negative sign
	}

	memoize(memoizeKey, formattedString);
	return formattedString;
};

/**
 * Cleans up the formatBN memoized cache.
 *
 * @function cleanCacheFormatBN
 * @since 0.0.8
 */
export function cleanCacheFormatBN() {
	Object.keys(TIMERS).forEach(k => {
		clearTimeout(TIMERS[k]);
		delete TIMERS[k];
		delete MEMOIZATION[k];
	});
}

export default formatBN;
