/* eslint-disable func-names */
/* global describe, test, expect, jest */

import { later } from '../index';

describe('Testing later-method', () => {
	describe('without repeat', () => {
		test('later', done => {
			let count = 0;
			later(() => {
				count += 1;
			}, 100);
			// purposly, check after >2x timeout --> count should only increase 1x
			setTimeout(() => {
				expect(count).toBe(1);
				done();
			}, 280);
		});
		test('canceled later', done => {
			let count = 0;
			const handle = later(() => {
				count += 1;
			}, 100);
			setTimeout(() => {
				handle.cancel();
			}, 10);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 180);
		});
		test('without timeout', done => {
			let count = 0;
			later(() => {
				count += 1;
			});
			// also check `countbefore` --> in case later doesn"t run asynchronously,
			// count will be 1 at this stage (which has to be 0)
			const countbefore = count;
			setTimeout(() => {
				expect(count).toBe(1);
				expect(countbefore).toBe(0);
				done();
			}, 80);
		});
		test('canceled without timeout', done => {
			let count = 0;
			const handle = later(() => {
				count += 1;
			});
			handle.cancel();
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 80);
		});
	});
	describe('repeated', () => {
		test('later repeated every 100ms, check at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				true,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(0);
				done();
			}, 50);
		});
		test('later repeated every 100ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				true,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(2);
				done();
			}, 280);
		});
		test('later repeated every 100ms canceled at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				true,
			);
			setTimeout(() => {
				handle.cancel();
			}, 50);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 280);
		});
		test('later repeated every 100ms canceled at 250ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				true,
			);
			setTimeout(() => {
				handle.cancel();
			}, 250);
			setTimeout(() => {
				expect(count).toBe(2);
				done();
			}, 480);
		});
	});
	describe('repeated with different first interval', () => {
		test('later first 100ms, repeated every 200ms, check at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				200,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(0);
				done();
			}, 50);
		});
		test('later first 100ms, repeated every 200ms, check at 150ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				200,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(1);
				done();
			}, 150);
		});
		test('later first 100ms, repeated every 200ms, check at 250ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				200,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(1);
				done();
			}, 250);
		});
		test('later first 100ms, repeated every 200ms, check at 350ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				200,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(2);
				done();
			}, 350);
		});
		test('later first 100ms, repeated every 200ms, check at 450ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				200,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(2);
				done();
			}, 450);
		});
		test('later first 100ms, repeated every 200ms, check at 550ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				200,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(3);
				done();
			}, 550);
		});
		test('later first 100ms, repeated every 200ms canceled at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				200,
			);
			setTimeout(() => {
				handle.cancel();
			}, 50);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 650);
		});
		test('later first 100ms, repeated every 200ms canceled at 250ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				200,
			);
			setTimeout(() => {
				handle.cancel();
			}, 250);
			setTimeout(() => {
				expect(count).toBe(1);
				done();
			}, 650);
		});
		test('later first 100ms, repeated every 200ms canceled at 600ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				200,
			);
			setTimeout(() => {
				handle.cancel();
			}, 600);
			setTimeout(() => {
				expect(count).toBe(3);
				done();
			}, 850);
		});
		test('check context without interval', done => {
			const a = {};
			const fn = function () {
				expect(this).toBe(a);
				done();
			};
			later(fn.bind(a), 0);
		});
		test('check context with interval', done => {
			const a = {};
			const fn = function () {
				expect(this).toBe(a);
			};
			const handle = later(fn.bind(a), 50, true);
			setTimeout(() => {
				handle.cancel();
				done();
			}, 100);
		});
		test('check going to async', done => {
			later(done);
		});
	});
});

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
		test('canceled later within first loop', done => {
			let count = 0;
			const handle = later(() => {
				count += 1;
			}, 1000);
			setTimeout(() => {
				handle.cancel();
			}, 10);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 1080);
		});
		test('canceled later within second loop', done => {
			let count = 0;
			const handle = later(() => {
				count += 1;
			}, 1000);
			setTimeout(() => {
				handle.cancel();
			}, 550);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 1080);
		});
		test('canceled later within third loop', done => {
			let count = 0;
			const handle = later(() => {
				count += 1;
			}, 1000);
			setTimeout(() => {
				handle.cancel();
			}, 950);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 1080);
		});
	});

	describe('repeated', () => {
		test('later repeated every 1000ms, check at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				1000,
				true,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(0);
				done();
			}, 50);
		});
		test('later repeated every 1000ms check at 1100ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				1000,
				true,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(1);
				done();
			}, 1100);
		});
		test('later repeated every 1000ms check at 2100ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				1000,
				true,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(2);
				done();
			}, 2100);
		});
		test('later repeated every 1000ms canceled at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				1000,
				true,
			);
			setTimeout(() => {
				handle.cancel();
			}, 50);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 1080);
		});
		test('later repeated every 1000ms canceled at 1100ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				1000,
				true,
			);
			setTimeout(() => {
				handle.cancel();
			}, 1100);
			setTimeout(() => {
				expect(count).toBe(1);
				done();
			}, 1180);
		});
		test('later repeated every 1000ms canceled at 2100ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				1000,
				true,
			);
			setTimeout(() => {
				handle.cancel();
			}, 2100);
			setTimeout(() => {
				expect(count).toBe(2);
				done();
			}, 2180);
		});
	});

	describe('repeated with different first interval - first large, second large', () => {
		test('later repeated 450ms/500ms, check at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				450,
				500,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(0);
				done();
			}, 50);
		});
		test('later repeated 450ms/500ms, check at 550ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				450,
				500,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(1);
				done();
			}, 550);
		});
		test('later repeated 450ms/500ms, check at 1050ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				450,
				500,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(2);
				done();
			}, 1050);
		});
		test('later repeated 450ms/500ms, canceled at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				450,
				500,
			);
			setTimeout(() => {
				handle.cancel();
			}, 50);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 1050);
		});
		test('later repeated 450ms/500ms, canceled at 550ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				450,
				500,
			);
			setTimeout(() => {
				handle.cancel();
			}, 550);
			setTimeout(() => {
				expect(count).toBe(1);
				done();
			}, 1550);
		});
		test('later repeated 450ms/500ms, canceled at 1050ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				450,
				500,
			);
			setTimeout(() => {
				handle.cancel();
			}, 1050);
			setTimeout(() => {
				expect(count).toBe(2);
				done();
			}, 2050);
		});
	});

	describe('repeated with different first interval - first small, second large', () => {
		test('later repeated 100ms/500ms, check at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				500,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(0);
				done();
			}, 50);
		});
		test('later repeated 100ms/500ms, check at 250ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				500,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(1);
				done();
			}, 250);
		});
		test('later repeated 100ms/500ms, check at 750ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				500,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(2);
				done();
			}, 750);
		});
		test('later repeated 100ms/500ms, check at 1250ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				500,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(3);
				done();
			}, 1250);
		});
		test('later repeated 100ms/500ms, canceled at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				500,
			);
			setTimeout(() => {
				handle.cancel();
			}, 50);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 1150);
		});
		test('later repeated 100ms/500ms, canceled at 250ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				500,
			);
			setTimeout(() => {
				handle.cancel();
			}, 250);
			setTimeout(() => {
				expect(count).toBe(1);
				done();
			}, 1650);
		});
		test('later repeated 100ms/500ms, canceled at 750ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				500,
			);
			setTimeout(() => {
				handle.cancel();
			}, 750);
			setTimeout(() => {
				expect(count).toBe(2);
				done();
			}, 2150);
		});
		test('later repeated 100ms/500ms, canceled at 1250ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				100,
				500,
			);
			setTimeout(() => {
				handle.cancel();
			}, 1250);
			setTimeout(() => {
				expect(count).toBe(3);
				done();
			}, 2650);
		});
	});

	describe('repeated with different first interval - first large, second small', () => {
		test('later repeated 500ms/100ms, check at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				500,
				100,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(0);
				done();
			}, 50);
		});
		test('later repeated 500ms/100ms, check at 550ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				500,
				100,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(1);
				done();
			}, 550);
		});
		test('later repeated 500ms/100ms, check at 650ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				500,
				100,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(2);
				done();
			}, 650);
		});
		test('later repeated 500ms/100ms, check at 750ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				500,
				100,
			);
			setTimeout(() => {
				handle.cancel();
				expect(count).toBe(3);
				done();
			}, 750);
		});
		test('later repeated 500ms/100ms, canceled at 50ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				500,
				100,
			);
			setTimeout(() => {
				handle.cancel();
			}, 50);
			setTimeout(() => {
				expect(count).toBe(0);
				done();
			}, 750);
		});
		test('later repeated 500ms/100ms, canceled at 550ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				500,
				100,
			);
			setTimeout(() => {
				handle.cancel();
			}, 550);
			setTimeout(() => {
				expect(count).toBe(1);
				done();
			}, 850);
		});
		test('later repeated 500ms/100ms, canceled at 650ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				500,
				100,
			);
			setTimeout(() => {
				handle.cancel();
			}, 650);
			setTimeout(() => {
				expect(count).toBe(2);
				done();
			}, 950);
		});
		test('later repeated 500ms/100ms, canceled at 750ms', done => {
			let count = 0;
			const handle = later(
				() => {
					count += 1;
				},
				500,
				100,
			);
			setTimeout(() => {
				handle.cancel();
			}, 750);
			setTimeout(() => {
				expect(count).toBe(3);
				done();
			}, 1050);
		});
	});
});
