const intl = {
	loc: 'en-US',
	formatMessage: () => {},
};

Object.defineProperty(intl, 'locale', {
	get() {
		return this.loc;
	},
	set(v) {
		this.loc = v;
	},
});

const setLocale = value => {
	intl.locale = value;
};

const useIntl = () => intl;

// eslint-disable-next-line import/prefer-default-export
export { useIntl, setLocale };
