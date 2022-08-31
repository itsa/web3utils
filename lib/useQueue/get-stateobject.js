const getStateObject = (idRef, queueRef, forceUpdate) => {
    console.debug('getStateObject');
    const newStateObject = {
        add: (value, { nuDupes = false, sender = null }) => {
            if (nuDupes) {
                // search is thera are items in the queue with the same value and sender
                const found = queueRef.current.find(item => item.value === value && (!sender || item.sender === sender));
                if (found) {
                    console.warn(`useQueue will not add item ${value}: dupe found`);
                    return;
                }
            }
            idRef.current += 1;
            const item = {
                id: idRef.current,
                value,
                sender
            };
            queueRef.current.push(item);
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

// export default getStateObject;
module.exports = getStateObject;