/* eslint-disable func-names */
/* eslint-disable import/no-extraneous-dependencies */
import { useIntl as useIntlDefault } from 'gatsby-plugin-intl';
import noIntlFormatBN from '../format-bn';
import noIntlTranslate from '../translate';

const bindFormatLocale = function (fn, locale) {
	const context = this;

	return function (bigNumber, options = {}) {
		options.locale = locale;
		return fn.call(context, bigNumber, options);
	};
};

// hooks always need to be a function:
const useIntl = () => {
	const { locale, formatMessage, ...intl } = useIntlDefault();
	const formatBN = bindFormatLocale(noIntlFormatBN, locale);
	const t = noIntlTranslate.bind(null, formatMessage);

	return {
		...intl,
		formatBN,
		formatMessage,
		locale,
		t,
	};
};

export default useIntl;
