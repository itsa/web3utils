import { useEffect, useRef, useReducer } from 'react';
import getStateObject from './get-stateobject';

const useQueue = (initialValue = []) => {
    const queueArray = useRef(initialValue);
    const id = useRef(0);
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);

    // const queue = getStateObject(id, queueArray);
    const queue = useRef(getStateObject(id, queueArray, forceUpdate));

    useEffect(() => {
        return () => {
            queue.empty();
        }
    }, []);

    return queue.current;
};

export default useQueue;
