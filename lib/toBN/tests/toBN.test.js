/* global describe, test, expect, afterAll */

import { utils } from 'web3';

import toBN, { cleanCacheToBN } from '../index';

describe('Testing async-method', () => {
	afterAll(() => {
		return cleanCacheToBN();
	});

	test('toBN should return a bignumber', () => {
		const bn = toBN('1');
		expect(utils.isBN(bn)).toBe(true);
	});

	test('toBN should return a cached bignumber', () => {
		const bn1 = toBN('1');
		const bn2 = toBN('1');
		expect(bn1 === bn2).toBe(true);
	});
});
