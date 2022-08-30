/**
 * Checks browser cryptowallet support and type
 *
 * <i>Copyright (c) 2022 ITSA - https://itsa.io</i><br>
 * Proprietary License
 *
 *
 * @module cryptowalletDetection.js
 * @class cryptowalletDetection
 * @since 0.6.0
 */

// eslint-disable-next-line import/no-mutable-exports
let cryptowalletDetection = {};

// eslint-disable-next-line func-names
(function (win) {
    cryptowalletDetection.hasWallet = !!win.ethereum;
    if (cryptowalletDetection.hasWallet) {
        cryptowalletDetection.isBrave = ethereum.isBraveWallet;
        cryptowalletDetection.isMetaMask = !cryptowalletDetection.isBrave && ethereum.isMetaMask;
    }
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default cryptowalletDetection;
