/* eslint-disable func-names */

/**
 * This module will disable Brave's crypto wallet messages
 *
 * See https://github.com/brave/brave-core/blob/master/components/brave_extension/extension/brave_extension/content_dapps.ts
 *
 * <i>Copyright (c) 2020 ITSA - https://itsa.io</i><br>
 * Proprietary License
 *
 *
 * @module suppress-brave-cryptowallet.js
 * @class SuppressBraveCryptowallet
 * @since 0.4.12
 */

import { later } from '../timers';

let suppressMsg;

const noCryptoWalletMsg = () => {
	// eslint-disable-next-line no-unused-expressions
	suppressMsg && suppressMsg();
};

(function (win) {
	const HEAD = win.document && win.document.head;

	if (HEAD) {
		suppressMsg = () => {
			const timer = later(
				() => {
					const braveDappDetectionNode = HEAD.querySelector(
						'meta[name="dapp-detected"]',
					);

					if (braveDappDetectionNode) {
						braveDappDetectionNode.parentNode.removeChild(
							braveDappDetectionNode,
						);
						timer.cancel();
					}
				},
				0,
				250,
			); // delay 0ms (still async), and repeat every 250ms

			// make sure to stop the timer when no dom node got inserted:
			later(() => {
				timer.cancel();
			}, 5000);
		};
	}
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default noCryptoWalletMsg;
