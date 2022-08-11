const NOOP = () => {};

let clearCachedFiles = NOOP;
let unregisterServiceworkers = NOOP;
let updateServiceworkers = NOOP;

// eslint-disable-next-line func-names
(function (win) {
    const navigator = win.navigator;

    if (navigator && 'serviceWorker' in navigator) {
        /**
         * Clears the cache of all or a specified serviceworker
         *
         * @function clearCachedFiles
         * @param {serviceworker}
         * @since 0.2.0
         */
         clearCachedFiles = () => {
            let promise;
            try {
                promise = win.caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => caches.delete(cacheName))));
            }
            catch (err) {
                promise = Promise.reject(err);
            }
            return promise;
        };

        /**
         * Unregisters all or a specified serviceworker
         *
         * @function unregister
         * @param {serviceworker}
         * @since 0.2.0
         */
        unregisterServiceworkers = serviceworker => {
            let promise;
            try {
                if (serviceworker) {
                    promise = navigator.serviceWorker.getRegistrations().then(registrations => {
                        const item = registrations.find(registration => registration === serviceworker);
                        if (item) {
                            item.unregister();
                        }
                    });
                }
                else {
                    promise = navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(registration => registration.unregister())));
                }
            }
            catch (err) {
                promise = Promise.reject(err);
            }
            return promise;
        };

        /**
         * Updates the cache of all or a specified serviceworker
         *
         * @function update
         * @param {serviceworker}
         * @since 0.2.0
         */
        updateServiceworkers = serviceworker => {
            let promise;
            try {
                if (serviceworker) {
                    promise = navigator.serviceWorker.getRegistrations().then(registrations => {
                        const item = registrations.find(registration => registration === serviceworker);
                        if (item) {
                            return item.update();
                        }
                    });
                }
                else {
                    promise = navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(registration => registration.update())));
                }
            }
            catch (err) {
                promise = Promise.reject(err);
            }
            return promise;
        }
    }

})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

const fns = {
    clearCachedFiles,
    unregisterServiceworkers,
    updateServiceworkers
};

export default fns;