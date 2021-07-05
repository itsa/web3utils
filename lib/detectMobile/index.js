const MOBILE_NAVIGATORS = [
	/Android/i,
	/webOS/i,
	/iPhone/i,
	/iPad/i,
	/iPod/i,
	/BlackBerry/i,
	/Windows Phone/i,
];

// eslint-disable-next-line import/no-mutable-exports
let isMobile;

// eslint-disable-next-line func-names
(function (win) {
	if (!win || !win.navigator || !win.navigator.userAgent) {
		return false;
	}
	isMobile = !!MOBILE_NAVIGATORS.some(navigatorItem =>
		win.navigator.userAgent.match(navigatorItem),
	);
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default isMobile;
