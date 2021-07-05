import _ from 'lodash';

const t = (formatMessage, id, { values, def, transformer } = {}) => {
	const result = formatMessage({ id, defaultMessage: def }, values);
	if (typeof transformer === 'function') {
		return transformer(result);
	}
	if (typeof transformer === 'string') {
		return _[transformer](result);
	}
	return result;
};

export default t;
