// eslint-disable-next-line import/no-mutable-exports
let websiteURL = '';

// eslint-disable-next-line func-names
(function (win) {
    if (win && win.location) {
        websiteURL = win.location || '';
    }
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default websiteURL;
