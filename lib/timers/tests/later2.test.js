/* global describe, test, expect, jest */

import { later } from '../index';

describe('Testing later-method with long timeout', () => {
	jest.setTimeout(10000);

	describe('without repeat', () => {
		test('later', done => {
			let count = 0;
			later(() => {
				count += 1;
			}, 1000);
			// purposly, check after >2x timeout --> count should only increase 1x
			setTimeout(() => {
				expect(count).toBe(1);
				done();
			}, 2080);
		});
	});
});
