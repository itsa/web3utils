import ios from '../detectiOS';

const MOBILE_NAVIGATORS_NON_IOS = [
	/Android/i,
	/webOS/i,
	/BlackBerry/i,
	/Windows Phone/i,
];

// eslint-disable-next-line import/no-mutable-exports
let isMobile = false;

// eslint-disable-next-line func-names
(function (win) {
	if (!win || !win.navigator || !win.navigator.userAgent) {
		return;
	}
	isMobile = ios || !!MOBILE_NAVIGATORS_NON_IOS.some(navigatorItem =>
		win.navigator.userAgent.match(navigatorItem),
	);
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default isMobile;
