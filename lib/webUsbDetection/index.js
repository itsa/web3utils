/**
 * Checks browser web-usb support
 *
 * <i>Copyright (c) 2022 ITSA - https://itsa.io</i><br>
 * Proprietary License
 *
 *
 * @module webUsbDetection.js
 * @class webUsbDetection
 * @since 0.8.0
 */

// eslint-disable-next-line import/no-mutable-exports
let webUsbDetection = false;

// eslint-disable-next-line func-names
(function (win) {
    webUsbDetection = !!(win && win.navigator && win.navigator.usb);
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default webUsbDetection;
