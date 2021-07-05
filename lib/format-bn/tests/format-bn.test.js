/* global describe, test, expect, afterAll */

import { utils } from 'web3';

import formatBN, { cleanCacheFormatBN } from '../index';

const locale = 'en-US';
const { toBN } = utils;

const replaceCharacter = (text, index, character) => {
	return text.substr(0, index) + character + text.substr(index + 1);
};

describe('formatBN', () => {
	afterAll(() => {
		return cleanCacheFormatBN();
	});

	for (let i = 0; i <= 18; i += 1) {
		let bnStringRoundUp = '1000000000000000000';
		let bnStringRoundDown = '1000000000000000000';
		let expectedRoundUp;
		let expectedRoundDown;
		let j;
		if (i > 0) {
			// within digits
			bnStringRoundUp = replaceCharacter(bnStringRoundUp, i, '2');
			bnStringRoundDown = replaceCharacter(bnStringRoundDown, i, '2');
		}
		if (i < 18) {
			// beyond digits
			bnStringRoundUp = replaceCharacter(bnStringRoundUp, i + 1, '5');
			bnStringRoundDown = replaceCharacter(bnStringRoundDown, i + 1, '4');
			if (i < 17) {
				bnStringRoundDown = replaceCharacter(bnStringRoundDown, i + 2, '9');
			}
		}
		if (i > 0) {
			expectedRoundUp = '1.';
			expectedRoundDown = '1.';
			for (j = 1; j < i; j += 1) {
				expectedRoundUp += '0';
				expectedRoundDown += '0';
			}
			expectedRoundUp += i === 18 ? '2' : '3';
			expectedRoundDown += '2';
		} else {
			expectedRoundUp = '2';
			expectedRoundDown = '1';
		}

		test(`formatBN should round ${bnStringRoundUp} for ${i} digits to ${expectedRoundUp}`, async () => {
			expect(
				formatBN(toBN(bnStringRoundUp), {
					locale,
					decimals: i,
					assetDigits: 18,
				}),
			).toBe(expectedRoundUp);
		});

		test(`formatBN should round ${bnStringRoundDown} for ${i} digits to ${expectedRoundDown}`, async () => {
			expect(
				formatBN(toBN(bnStringRoundDown), {
					locale,
					decimals: i,
					assetDigits: 18,
				}),
			).toBe(expectedRoundDown);
		});
	}

	// test particlar example that showed a bug in the code:
	test('formatBN should show 5980000000000000 as 0.00598', async () => {
		expect(
			formatBN(toBN('5980000000000000'), { locale, assetDigits: 18 }),
		).toBe('0.00598');
	});

	// test another particlar example that showed a bug in the code:
	test('formatBN should format in another language', async () => {
		expect(
			formatBN(toBN('15099997933480000000000'), { locale, assetDigits: 18 }),
		).toBe('15,099.99793348');
	});

	test('formatBN process onlySignificant as expected', async () => {
		expect(
			formatBN(toBN('5980000000000000'), { locale, assetDigits: 18 }),
		).toBe('0.00598');
		expect(
			formatBN(toBN('5980000000000000'), {
				locale,
				decimals: null,
				onlySignificant: null,
				assetDigits: 18,
			}),
		).toBe('0.00598');
		expect(
			formatBN(toBN('5980000000000000'), {
				locale,
				decimals: undefined,
				onlySignificant: undefined,
				assetDigits: 18,
			}),
		).toBe('0.00598');
		expect(
			formatBN(toBN('5980000000000000'), {
				locale,
				decimals: null,
				onlySignificant: true,
				assetDigits: 18,
			}),
		).toBe('0.00598');
		expect(
			formatBN(toBN('5980000000000000'), {
				locale,
				decimals: null,
				onlySignificant: false,
				assetDigits: 18,
			}),
		).toBe('0.005980000000000000');
		expect(
			formatBN(toBN('1010000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				assetDigits: 18,
			}),
		).toBe('1,010');
	});

	test('formatBN should round 1.5 as 2 and 1.499 as 1 when rounded with zero decimals', async () => {
		expect(
			formatBN(toBN('1500000000000000000'), {
				locale,
				decimals: 0,
				assetDigits: 18,
			}),
		).toBe('2');
		expect(
			formatBN(toBN('1499000000000000000'), {
				locale,
				decimals: 0,
				assetDigits: 18,
			}),
		).toBe('1');
	});

	test('formatBN should process decimals when not given as expected', async () => {
		expect(
			formatBN(toBN('5980000000000000'), { locale, assetDigits: 18 }),
		).toBe('0.00598');
		expect(
			formatBN(toBN('1002005980000000000000'), { locale, assetDigits: 18 }),
		).toBe('1,002.00598');
	});

	test('formatBN should process negative decimals as zero decimals', async () => {
		expect(
			formatBN(toBN('1002500000000000000000'), {
				locale,
				decimals: -1,
				assetDigits: 18,
			}),
		).toBe('1,003');
		expect(
			formatBN(toBN('1002498000000000000000'), {
				locale,
				decimals: -1,
				assetDigits: 18,
			}),
		).toBe('1,002');
	});

	test('formatBN should process decimals>18 as 18 decimals', async () => {
		expect(
			formatBN(toBN('1002500000000000000001'), {
				locale,
				decimals: 18,
				assetDigits: 18,
			}),
		).toBe('1,002.500000000000000001');
		expect(
			formatBN(toBN('1002500000000000000001'), {
				locale,
				decimals: 19,
				assetDigits: 18,
			}),
		).toBe('1,002.500000000000000001');
	});

	// check significance:
	test('formatBN should render 0 as 0', async () => {
		expect(formatBN(toBN('0'), { locale, assetDigits: 18 })).toBe('0');
	});

	test('formatBN should render 0 as 0', async () => {
		expect(
			formatBN(toBN('1002500000000000000000'), { locale, assetDigits: 18 }),
		).toBe('1,002.5');
	});

	test('formatBN should render 0 as 0', async () => {
		expect(
			formatBN(toBN('1002000000000000000000'), { locale, assetDigits: 18 }),
		).toBe('1,002');
	});

	test('formatBN should render 0 as 0', async () => {
		expect(
			formatBN(toBN('1010000000000000000000'), { locale, assetDigits: 18 }),
		).toBe('1,010');
	});
	test('formatBN should render withSuffix K without onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1K');
	});

	test('formatBN should accept String', async () => {
		expect(
			formatBN('1010000000000000000000', {
				locale,
			}),
		).toBe('1,010,000,000,000,000,000,000');
	});

	test('formatBN should render withSuffix K with onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.0K');
	});

	test('formatBN should render withSuffix K rounded up', async () => {
		expect(
			formatBN(toBN('1450000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5K');
		expect(
			formatBN(toBN('1450000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5K');
	});

	test('formatBN should render withSuffix K rounded down', async () => {
		expect(
			formatBN(toBN('1440000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4K');
		expect(
			formatBN(toBN('1440000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4K');
	});

	test('formatBN should render withSuffix M without onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1M');
	});

	test('formatBN should render withSuffix M with onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.0M');
	});

	test('formatBN should render withSuffix M rounded up', async () => {
		expect(
			formatBN(toBN('1450000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5M');
		expect(
			formatBN(toBN('1450000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5M');
	});

	test('formatBN should render withSuffix M rounded down', async () => {
		expect(
			formatBN(toBN('1440000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4M');
		expect(
			formatBN(toBN('1440000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4M');
	});

	test('formatBN should render withSuffix B without onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1B');
	});

	test('formatBN should render withSuffix B with onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.0B');
	});

	test('formatBN should render withSuffix B rounded up', async () => {
		expect(
			formatBN(toBN('1450000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5B');
		expect(
			formatBN(toBN('1450000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5B');
	});

	test('formatBN should render withSuffix B rounded down', async () => {
		expect(
			formatBN(toBN('1440000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4B');
		expect(
			formatBN(toBN('1440000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4B');
	});

	test('formatBN should render withSuffix T without onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1T');
	});

	test('formatBN should render withSuffix T with onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.0T');
	});

	test('formatBN should render withSuffix T rounded up', async () => {
		expect(
			formatBN(toBN('1450000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5T');
		expect(
			formatBN(toBN('1450000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5T');
	});

	test('formatBN should render withSuffix T rounded down', async () => {
		expect(
			formatBN(toBN('1440000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4T');
		expect(
			formatBN(toBN('1440000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4T');
	});

	test('formatBN should render withSuffix P without onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1P');
	});

	test('formatBN should render withSuffix P with onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.0P');
	});

	test('formatBN should render withSuffix P rounded up', async () => {
		expect(
			formatBN(toBN('1450000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5P');
		expect(
			formatBN(toBN('1450000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5P');
	});

	test('formatBN should render withSuffix P rounded down', async () => {
		expect(
			formatBN(toBN('1440000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4P');
		expect(
			formatBN(toBN('1440000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4P');
	});

	test('formatBN should render withSuffix E without onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1E');
	});

	test('formatBN should render withSuffix E with onlySignificant', async () => {
		expect(
			formatBN(toBN('1010000000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.0E');
	});

	test('formatBN should render withSuffix E rounded up', async () => {
		expect(
			formatBN(toBN('1450000000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5E');
		expect(
			formatBN(toBN('1450000000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.5E');
	});

	test('formatBN should render withSuffix E rounded down', async () => {
		expect(
			formatBN(toBN('1440000000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4E');
		expect(
			formatBN(toBN('1440000000000000000000000000000000000'), {
				locale,
				decimals: 1,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1.4E');
	});

	test('formatBN should render the minimum amount of required minDigits', async () => {
		expect(
			formatBN(toBN('9145000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 0,
				assetDigits: 18,
			}),
		).toBe('9K');
		expect(
			formatBN(toBN('9145000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 1,
				assetDigits: 18,
			}),
		).toBe('9K');
		expect(
			formatBN(toBN('9145000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 2,
				assetDigits: 18,
			}),
		).toBe('9.1K');
		expect(
			formatBN(toBN('91450000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 2,
				assetDigits: 18,
			}),
		).toBe('91K');
		expect(
			formatBN(toBN('91450000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 3,
				assetDigits: 18,
			}),
		).toBe('91.5K');
		expect(
			formatBN(toBN('91450000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 4,
				assetDigits: 18,
			}),
		).toBe('91.45K');

		expect(
			formatBN(toBN('91451200000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 5,
				assetDigits: 18,
			}),
		).toBe('91.451K');

		expect(
			formatBN(toBN('91451200000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: false,
				minDigits: 5,
				assetDigits: 18,
			}),
		).toBe('91,451');

		expect(
			formatBN(toBN('91451200000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: false,
				minDigits: 6,
				assetDigits: 18,
			}),
		).toBe('91,451.2');

		expect(
			formatBN(toBN('91451200000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: false,
				minDigits: 5,
				assetDigits: 18,
			}),
		).toBe('0.0915');

		expect(
			formatBN(toBN('9145000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 0,
				assetDigits: 18,
			}),
		).toBe('9K');
		expect(
			formatBN(toBN('9145000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 1,
				assetDigits: 18,
			}),
		).toBe('9K');
		expect(
			formatBN(toBN('9145000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 2,
				assetDigits: 18,
			}),
		).toBe('9.1K');
		expect(
			formatBN(toBN('9150000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 2,
				assetDigits: 18,
			}),
		).toBe('9.2K');
		expect(
			formatBN(toBN('91450000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 2,
				assetDigits: 18,
			}),
		).toBe('91K');
		expect(
			formatBN(toBN('91440000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 3,
				assetDigits: 18,
			}),
		).toBe('91.4K');
		expect(
			formatBN(toBN('91440000000000000000000'), {
				locale,
				decimals: 0,
				onlySignificant: true,
				withSuffix: true,
				minDigits: 4,
				assetDigits: 18,
			}),
		).toBe('91.44K');
	});

	test('formatBN should render assetDigits', async () => {
		expect(
			formatBN(toBN('239145000000000000000000'), {
				locale,
				decimals: 1,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('239.1K');
		expect(
			formatBN(toBN('23914500000000'), {
				locale,
				withSuffix: true,
				assetDigits: 8,
			}),
		).toBe('239.145K');
		expect(
			formatBN(toBN('239145'), {
				locale,
				withSuffix: true,
				assetDigits: 0,
			}),
		).toBe('239K');
		expect(
			formatBN(toBN('239145'), {
				locale,
				withSuffix: true,
			}),
		).toBe('239K');
		expect(
			formatBN(toBN('239145'), {
				locale,
				withSuffix: true,
				assetDigits: -1,
			}),
		).toBe('239K');
	});

	test('reusage of same bignumber should work', async () => {
		expect(
			formatBN(toBN('239145000000000000000000'), {
				locale,
				decimals: 1,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('239.1K');
		expect(
			formatBN(toBN('239145000000000000000000'), {
				locale,
				decimals: 1,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('239.1K');
	});
});
