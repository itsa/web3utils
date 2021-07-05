/* global describe, test, expect, jest, afterAll */

import { utils } from 'web3';
import { setLocale } from 'gatsby-plugin-intl';
import useIntl from '../index';
import { cleanCacheFormatBN } from '../../format-bn';

jest.mock('gatsby-plugin-intl');

// eslint-disable-next-line react-hooks/rules-of-hooks
setLocale('de-DE');
// eslint-disable-next-line react-hooks/rules-of-hooks
const { formatBN } = useIntl();
const { toBN } = utils;

describe('formatBN', () => {
	afterAll(() => {
		return cleanCacheFormatBN();
	});
	test('', () => {
		expect(
			formatBN(toBN('1450000000000000000000000000000000000'), {
				decimals: 3,
				onlySignificant: true,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1,45E');
		expect(
			formatBN(toBN('1450000000000000000000000000000000000'), {
				decimals: 3,
				onlySignificant: false,
				withSuffix: true,
				assetDigits: 18,
			}),
		).toBe('1,450E');
	});
});
