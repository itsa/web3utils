const select = require('select');

// eslint-disable-next-line import/no-mutable-exports
let copyToClipboard;

// NOTE: navigator can not be used directly, because Gatsby would not be able to build (sees it as an undefined global variable).
// That is why wee need to wrap it with the next function
(function (win) {
	let textAreaElement,
		killFocus = true;
	const navigator = win.navigator,
		doc = win.document,
		navClipboardSupport = navigator && navigator.clipboard, // check navigator first, otherwise Gatsby build will fail
		canPolyfill = !!doc && typeof doc.execCommand === 'function'; // also check doc, otherwise Gatsby build will fail

	// If no clibboard support, then create a hidden textarea element as fallback
	// we keep i in the dom for re-usage
	if (!navClipboardSupport && canPolyfill && doc) {
		// also check doc, otherwise Gatsby build will fail
		textAreaElement = doc.createElement('textarea');
		// make sure no one sees it and it doesn't disturb scroll feature
		let style = textAreaElement.style;
		style.top = '-100px';
		style.left = '-100px';
		style.zIndex = '-100';
		style.height = '1px';
		style.width = '1px';
		style.position = 'absolute';
		doc.body.appendChild(textAreaElement);
	}

	/**
	 * Returns an Intl object for a specific locale.
	 * Creates maximum 1 instance per locale: uses internal cache.
	 *
	 * @function copyToClipboard
	 * @param {string} text - The text to be copied to the clipboard
	 * @return {Boolean} "true" when successfully copied the text to the clipboard; "false" otherwise
	 * @since 0.1.1
	 */
	copyToClipboard = async text => {
		if (navClipboardSupport) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch (err) {
				console.error(err.message);
				return false;
			}
		}
		// no navClipboardSupport here
		if (!canPolyfill) {
			return false;
		}
		// h4x0r
		if (killFocus) {
			textAreaElement.style.top = window.pageYOffset + 'px';
			killFocus = false;
		}
		textAreaElement.innerText = text;
		select(textAreaElement);
		return doc.execCommand('copy');
	};
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

export default copyToClipboard;
