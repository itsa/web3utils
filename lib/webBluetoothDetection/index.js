/**
 * Checks browser web-bluetooth support
 *
 * <i>Copyright (c) 2022 ITSA - https://itsa.io</i><br>
 * Proprietary License
 *
 *
 * @module webBluetoothDetection.js
 * @class webBluetoothDetection
 * @since 0.8.0
 */

// eslint-disable-next-line import/no-mutable-exports
let webBluetoothDetection = Promise.resolve(false);

// eslint-disable-next-line func-names
(function (win) {
    if (win && win.navigator) {
        const bluetooth = win.navigator.bluetooth;
        if (bluetooth) {
            webBluetoothDetection = bluetooth.getAvailability.bind(bluetooth);
        }
    }
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default webBluetoothDetection;
