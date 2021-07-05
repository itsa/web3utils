/* global describe, test, expect */

import generator from '../index';

describe('Testing unique generated Id"s', () => {
	test('first item without namespace --> 1', () => {
		expect(generator()).toBe(1);
	});
	test('second item without namespace --> 2', () => {
		expect(generator()).toBe(2);
	});
	test('first item with namespace --> dom-1', () => {
		expect(generator('dom')).toBe('dom-1');
	});
	test('second item with namespace --> dom-2', () => {
		expect(generator('dom')).toBe('dom-2');
	});
	test('third item without namespace and after another namespace --> 3', () => {
		expect(generator()).toBe(3);
	});
	test('third item with namespace and after another namespace --> dom-3', () => {
		expect(generator('dom')).toBe('dom-3');
	});
	test('item without namespace with start specified --> 1000', () => {
		expect(generator(1000)).toBe(1000);
	});
	test('item with namespace with start specified --> dom-500', () => {
		expect(generator('dom', 500)).toBe('dom-500');
	});
	test('item without namespace after start specified --> 1001', () => {
		expect(generator()).toBe(1001);
	});
	test('item with namespace after start specified --> dom-501', () => {
		expect(generator('dom')).toBe('dom-501');
	});
	test('item without namespace with invalid start specified --> 1002', () => {
		expect(generator(700)).toBe(1002);
	});
	test('item with namespace with invalid start specified --> dom-502', () => {
		expect(generator('dom', 300)).toBe('dom-502');
	});
	test('initial item start specified with namespace --> eventid-200', () => {
		expect(generator('eventid', 200)).toBe('eventid-200');
	});
	test('next item after initial item start specified with namespace --> eventid-201', () => {
		expect(generator('eventid')).toBe('eventid-201');
	});
	test('initial item start specified with namespace at position 0 --> zero-0', () => {
		expect(generator('zero', 0)).toBe('zero-0');
	});
	test('next item after initial item started at 0 specified with namespace --> zero-1', () => {
		expect(generator('zero')).toBe('zero-1');
	});
});
