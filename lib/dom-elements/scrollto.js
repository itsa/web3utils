/* eslint-disable no-underscore-dangle */
import { async, later } from '../timers';

const scrollTo = WINDOW => {
	const DOCUMENT = WINDOW.document;
	const BODY = DOCUMENT.body;
	const SCROLL_TIMER = 20;

	return (
		container,
		currentLeft,
		currentTop,
		newLeft,
		newTop,
		transitionTime,
	) => {
		const windowContainer = container === WINDOW;
		// eslint-disable-next-line one-var
		let incrementX = 1,
			incrementY = 1,
			downX = true,
			downY = true,
			top = currentTop,
			left = currentLeft,
			laterFn;

		if (newLeft === undefined) {
			newLeft = container === WINDOW ? BODY.scrollLeft : container.scrollLeft;
		}
		if (newTop === undefined) {
			newTop = container === WINDOW ? BODY.scrollTop : container.scrollTop;
		}

		if (currentLeft !== newLeft || currentTop !== newTop) {
			if (windowContainer) {
				container = DOCUMENT.documentElement;
			}
			if (transitionTime) {
				// animate
				incrementX = (newLeft - left) * (SCROLL_TIMER / transitionTime);
				incrementY = (newTop - top) * (SCROLL_TIMER / transitionTime);
				downX = newLeft > left;
				downY = newTop > top;
				laterFn = container._scrollTimer;
				if (laterFn) {
					laterFn.cancel();
				}
				laterFn = later(
					() => {
						// if the node is out of the DOM, then cancel:
						if (!DOCUMENT.documentElement.contains(container)) {
							delete container._scrollTimer;
							laterFn.cancel();
						}
						left += incrementX;
						top += incrementY;
						if (downX) {
							if (left > newLeft) {
								left = newLeft;
							}
						} else if (left < newLeft) {
							left = newLeft;
						}
						if (downY) {
							if (top > newTop) {
								top = newTop;
							}
						} else if (top < newTop) {
							top = newTop;
						}
						container.scrollTo(Math.round(left), Math.round(top));
						if (top === newTop) {
							delete container._scrollTimer;
							laterFn.cancel();
						}
					},
					0,
					SCROLL_TIMER,
				);
				container._scrollTimer = laterFn;
			} else {
				async(() => {
					container.scrollTo(newLeft, newTop);
				});
			}
		}
	};
};

export default scrollTo;
