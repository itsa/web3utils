const isNode =
	typeof global !== 'undefined' &&
	{}.toString.call(global) === '[object global]' &&
	(!global.document ||
		{}.toString.call(global.document) !== '[object HTMLDocument]');

export default isNode;
