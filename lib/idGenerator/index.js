/* eslint-disable no-plusplus */
const UNDEFINED_NS = '__undefined__';
const namespaces = {};

/**
 * Collection of various utility functions.
 *
 *
 * <i>Copyright (c) 2014 ITSA - https://github.com/itsa</i>
 * New BSD License - http://choosealicense.com/licenses/bsd-3-clause/
 *
 * @module utils
 * @class Utils
 * @static
 */

/**
 * Generates an unique id with the signature: "namespace-follownr"
 *
 * @example
 *
 *     var generator = require("itsa-utils").idGenerator;
 *
 *     console.log(generator()); // --> 1
 *     console.log(generator()); // --> 2
 *     console.log(generator(1000)); // --> 1000
 *     console.log(generator()); // --> 1001
 *     console.log(generator("Parcel, 500")); // -->"Parcel-500"
 *     console.log(generator("Parcel")); // -->"Parcel-501"
 *
 *
 * @method idGenerator
 * @param [namespace] {String} namespace to prepend the generated id.
 *        When ignored, the generator just returns a number.
 * @param [start] {Number} startvalue for the next generated id. Any further generated id"s will preceed this id.
 *        If `start` is lower or equal than the last generated id, it will be ignored.
 * @return {Number|String} an unique id. Either a number, or a String (digit prepended with "namespace-")
 */
const idGenerator = (namespace, start) => {
	// in case `start` is set at first argument, transform into (null, start)
	if (typeof namespace === 'number') {
		start = namespace;
		namespace = null;
	}

	if (!namespace) {
		namespace = UNDEFINED_NS;
	}

	if (!namespaces[namespace]) {
		namespaces[namespace] = typeof start === 'number' ? start : 1;
	} else if (typeof start === 'number' && namespaces[namespace] < start) {
		namespaces[namespace] = start;
	}
	return namespace === UNDEFINED_NS
		? namespaces[namespace]++
		: `${namespace}-${namespaces[namespace]++}`;
};

export default idGenerator;
