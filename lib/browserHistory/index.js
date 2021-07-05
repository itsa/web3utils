// eslint-disable-next-line import/no-mutable-exports
let browserHistory;

// eslint-disable-next-line func-names
(function (win) {
	const history = win.history || {
		go: () => {},
	};

	const goBack = () => {
		if (history.state) {
			history.back();
		} else {
			history.go(-1);
		}
	};

	const goForward = () => {
		if (history.state) {
			history.forward();
		} else {
			history.go(1);
		}
	};

	browserHistory = {
		goBack,
		goForward,
	};
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default browserHistory;
