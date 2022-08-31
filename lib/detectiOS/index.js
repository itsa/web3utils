// eslint-disable-next-line import/no-mutable-exports
let ios = false;

// eslint-disable-next-line func-names
(function (win) {
    if (!win || !win.document || !win.navigator || !win.navigator.platform || !win.navigator.platform) {
        return false;
    }
    const checkiOS = () => {
        return [
          'iPad Simulator',
          'iPhone Simulator',
          'iPod Simulator',
          'iPad',
          'iPhone',
          'iPod'
        ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in win.document)
    };
    ios = checkiOS();
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default ios;
