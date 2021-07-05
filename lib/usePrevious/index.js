import { useRef, useEffect } from 'react';

const usePrevious = (value, currentIfUndefined = true) => {
	const ref = useRef();
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return currentIfUndefined && ref.current === undefined ? value : ref.current;
};

export default usePrevious;
