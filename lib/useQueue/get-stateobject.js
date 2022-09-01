import { isObject, isEqual } from 'lodash';

const getStateObject = (idRef, queueRef, forceUpdate) => {
    const getLastSeverityIndex = (severity = 0) => {
        const index = queueRef.current.findIndex(item => item.severity < severity);
        // if not found, then return the highest index position, because we need to append the new item
        return index === -1 ? queueRef.current.length - 1 : index;
    };

    const newStateObject = {
        add: (value, options = {}) => {
            const { noDupes = false, sender = null, match = null, severity = 0 } = options;
            if (noDupes) {
                // search is thera are items in the queue with the same value and sender
                const found = queueRef.current.find(item => {
                    let valueMatch;
                    if (match) {
                        valueMatch = isObject(item.match) && isObject(match) ? isEqual(item.match, match) : item.match === match;
                    } else {
                        valueMatch = isObject(item.value) && isObject(value) ? isEqual(item.value, value) : item.value === value;
                    }
                    const senderMatch = !sender || item.sender === sender;
                    return valueMatch && senderMatch;
                });
                if (found) {
                    console.warn(`useQueue will not add item ${value}: dupe found`);
                    return;
                }
            }
            idRef.current += 1;
            const item = {
                id: idRef.current,
                value,
                severity,
                sender,
                match
            };
            if (!severity || queueRef.current.length === 0) {
                queueRef.current.push(item);
            } else {
                // insert the item at the right index
                const index = getLastSeverityIndex(severity);
                queueRef.current.splice(index + 1, 0, item);
            }
            forceUpdate();
            return item.id;
        },
        remove: id => {
            if (id) {
                // lookup
                const index = queueRef.current.findIndex(item => item.id === id);
                if (index !== -1) {
                    queueRef.current.splice(index, 1);
                    forceUpdate();
                }
            } else {
                const size = queueRef.current.length - 1;
                if (size >= 0) {
                    queueRef.current.length = size;
                    forceUpdate();
                }
            }
        },
        empty: () => {
            queueRef.current.length = 0;
            forceUpdate();
        },
        getItemById: (id) => {
            if (id) {
                // lookup
                const index = queueRef.current.findIndex(item => item.id === id);
                if (index !== -1) {
                    return queueRef.current[index].value
                }
            }
        },
    };
    Object.defineProperties(newStateObject, {
        first: {
            get: () => queueRef.current[0] && queueRef.current[0].value
        },
        last: {
            get: () => queueRef.current[0] && queueRef.current[queueRef.current.length - 1].value
        },
        size: {
            get: () => queueRef.current.length
        }
    });
    return newStateObject;
};

export default getStateObject;
