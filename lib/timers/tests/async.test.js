/* global describe, test, expect */
/* eslint-disable func-names */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extend-native */

import { async } from '../index';

describe('Testing async-method', () => {
	test('went async', () => {
		let count = 0;
		async(() => {
			count += 1;
		});
		expect(count).toBe(0);
	});
	test('invoked', done => {
		let count = 0;
		async(() => {
			count = 1;
		});
		setTimeout(() => {
			expect(count).toBe(1);
			done();
		}, 25);
	});
	test('invoked asap', done => {
		let count = 0;
		async(() => {
			count += 1;
		});
		expect(count).toBe(0);
		setTimeout(() => {
			expect(count).toBe(1);
			done();
		}, 5);
	});
	test('canceled async', done => {
		let count = 0;
		const handle = async(() => {
			count += 1;
		});
		handle.cancel();
		setTimeout(() => {
			expect(count).toBe(0);
			done();
		}, 25);
	});
	test('check context', done => {
		const a = {};
		const fn = function () {
			// eslint-disable-next-line no-unused-expressions
			expect(this === a).toBe.true;
			done();
		};
		async(fn.bind(a));
	});
});
