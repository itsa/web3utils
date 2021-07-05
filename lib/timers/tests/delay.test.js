/* global describe, test, expect, jest */
/* eslint-disable func-names */

import { delay } from '../index';

describe('Testing delay-method', () => {
	jest.setTimeout(10000);

	test('delay', async () => {
		const start = new Date();
		await delay(1000);
		const end = new Date();
		expect(end.getTime()).toBeGreaterThan(start.getTime() + 1000);
		expect(end.getTime()).toBeLessThan(start.getTime() + 1500);
	});
});
