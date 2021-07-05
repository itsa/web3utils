/* eslint-disable no-underscore-dangle */
import isNode from '../isNode';
import scrollToFn from './scrollto';

const DOCUMENT_TEMPLATE = {
	document: {
		documentElement: {},
		body: {
			scrollLeft: 0,
			scrollTop: 0,
		},
	},
};

// eslint-disable-next-line no-undef
const WINDOW = isNode ? global.window || DOCUMENT_TEMPLATE : window;
const DOCUMENT = WINDOW.document;
const BODY = DOCUMENT.body;
const OVERFLOW = 'overflow';
const SCROLL = 'scroll';
const BORDER = 'border';
const WIDTH = 'width';
const _LEFT = '-left';
const _TOP = '-top';
const BORDER_LEFT_WIDTH = `${BORDER + _LEFT}-${WIDTH}`;
const BORDER_RIGHT_WIDTH = `${BORDER}-right-${WIDTH}`;
const BORDER_TOP_WIDTH = `${BORDER + _TOP}-${WIDTH}`;
const BORDER_BOTTOM_WIDTH = `${BORDER}-bottom-${WIDTH}`;

const scrollTo = scrollToFn(WINDOW);

const toCamelCase = (input = '') => {
	return input.replace(/-(.)/g, (match, group) => group.toUpperCase());
};

export const nodeLeft = node =>
	Math.round(node.getBoundingClientRect().left + BODY.scrollLeft);
export const nodeRight = node => nodeLeft(node) + node.offsetWidth;
export const nodeTop = node =>
	Math.round(node.getBoundingClientRect().top + BODY.scrollTop);
export const nodeBottom = node => nodeTop(node) + node.offsetHeight;

/**
 * Returns cascaded style of the specified property. `Cascaded` means: the actual present style,
 * the way it is visible (calculated through the DOM-tree).
 *
 * <ul>
 *     <li>Note1: values are absolute: percentages and points are converted to absolute values, sizes are in pixels, colors in rgb/rgba-format.</li>
 *     <li>Note2: you cannot query shotcut-properties: use `margin-left` instead of `margin`.</li>
 *     <li>Note3: no need to camelCase cssProperty: both `margin-left` as well as `marginLeft` are fine.</li>
 *     <li>Note4: you can query `transition`, `transform`, `perspective` and `transform-origin` instead of their vendor-specific properties.</li>
 *     <li>Note5: `transition` or `transform` return an Object instead of a String.</li>
 * </ul>
 *
 * @method getNodeStyle
 * @param cssProperty {String} property that is queried
 * @param [pseudo] {String} to query pseudo-element, fe: `:before` or `:first-line`
 * @return {String|Object} value for the css-property: this is an Object for the properties `transition` or `transform`
 * @since 0.0.1
 */
// Cautious: when reading the property `transform`, getComputedStyle should
// read the calculated value, but some browsers (webkit) only calculate the style on the current element
// In those cases, we need a patch and look up the tree ourselves
//  Also: we will return separate value, NOT matrices
export const getNodeStyle = (node, cssProperty, pseudo) =>
	WINDOW.getComputedStyle(node, pseudo)[toCamelCase(cssProperty)];

/**
 * Forces the Element to be inside an ancestor-Element that has the `overfow="scroll" set.
 *
 * @method scrollIntoView
 * @param [ancestor] {Element} the Element where it should be forced into its view.
 *        Only use this when you know the ancestor and this ancestor has an `overflow="scroll"` property
 *        when not set, this method will seek through the doc-tree upwards for the first Element that does match this criteria.
 * @chainable
 * @since 0.0.1
 */
export const scrollIntoParentView = (node, ancestor, options = {}) => {
	if (!node) {
		// eslint-disable-next-line no-console
		console.error('scrollIntoParentView undefined node');
		return;
	}
	if (!ancestor) {
		// eslint-disable-next-line no-console
		console.error('scrollIntoParentView undefined ancestor');
		return;
	}
	const {
		transitionTime,
		marginLeft = 0,
		marginRight = 0,
		marginTop = 0,
		marginBottom = 0,
	} = options;
	// eslint-disable-next-line one-var
	let parentOverflowNode = node.parentNode,
		left,
		width,
		right,
		height,
		top,
		bottom,
		scrollLeft,
		scrollTop,
		parentOverflowNodeX,
		parentOverflowNodeY,
		parentOverflowNodeStartTop,
		parentOverflowNodeStartLeft,
		parentOverflowNodeStopRight,
		parentOverflowNodeStopBottom,
		newX,
		newY;
	if (parentOverflowNode) {
		if (ancestor) {
			parentOverflowNode = ancestor;
		} else {
			while (
				parentOverflowNode &&
				parentOverflowNode !== DOCUMENT &&
				!(
					getNodeStyle(parentOverflowNode, OVERFLOW) === SCROLL ||
					getNodeStyle(parentOverflowNode, `${OVERFLOW}-y`) === SCROLL
				)
			) {
				parentOverflowNode = parentOverflowNode.parentNode;
			}
		}
		if (parentOverflowNode && parentOverflowNode !== DOCUMENT) {
			left = nodeLeft(node);
			width = node.offsetWidth;
			right = left + width;
			height = node.offsetHeight;
			top = nodeTop(node);
			bottom = top + height;
			scrollLeft =
				parentOverflowNode === WINDOW
					? BODY.scrollLeft
					: parentOverflowNode.scrollLeft;
			scrollTop =
				parentOverflowNode === WINDOW
					? BODY.scrollTop
					: parentOverflowNode.scrollTop;
			parentOverflowNodeX = nodeLeft(parentOverflowNode);
			parentOverflowNodeY = nodeTop(parentOverflowNode);
			parentOverflowNodeStartTop =
				parentOverflowNodeY +
				parseInt(getNodeStyle(parentOverflowNode, BORDER_TOP_WIDTH), 10) +
				marginTop;
			parentOverflowNodeStartLeft =
				parentOverflowNodeX +
				parseInt(getNodeStyle(parentOverflowNode, BORDER_LEFT_WIDTH), 10) +
				marginLeft;
			parentOverflowNodeStopRight =
				parentOverflowNodeX +
				parentOverflowNode.offsetWidth -
				parseInt(getNodeStyle(parentOverflowNode, BORDER_RIGHT_WIDTH), 10) +
				marginRight;
			parentOverflowNodeStopBottom =
				parentOverflowNodeY +
				parentOverflowNode.offsetHeight -
				parseInt(getNodeStyle(parentOverflowNode, BORDER_BOTTOM_WIDTH), 10) +
				marginBottom;

			if (left < parentOverflowNodeStartLeft) {
				newX = Math.max(0, scrollLeft + left - parentOverflowNodeStartLeft);
			} else if (right > parentOverflowNodeStopRight) {
				newX = scrollLeft + right - parentOverflowNodeStopRight;
			}
			if (top < parentOverflowNodeStartTop) {
				newY = Math.max(0, scrollTop + top - parentOverflowNodeStartTop);
			} else if (bottom > parentOverflowNodeStopBottom) {
				newY = scrollTop + bottom - parentOverflowNodeStopBottom;
			}
			scrollTo(
				parentOverflowNode,
				scrollLeft,
				scrollTop,
				newX,
				newY,
				transitionTime,
			);
		}
	}
};
