import { later } from '../timers';
/**
 * Returns a Promise with 5 additional methods:
 *
 * promise.fulfill
 * promise.reject
 * promise.callback
 * promise.setCallback
 * promise.isPending
 * promise.stayActive --> force the promise not to resolve in the specified time
 *
 * With Promise.manage, you get a Promise which is managable from outside, not inside as Promise A+ work.
 * You can invoke promise.**callback**() which will invoke the original passed-in callbackFn - if any.
 * promise.**fulfill**() and promise.**reject**() are meant to resolve the promise from outside, just like deferred can do.
 *
 * If `stayActive` is defined, the promise will only be resolved after this specified time (ms). When `fulfill` or `reject` is
 * called, it will be applied after this specified time.
 *
 * @example
 *     var promise = managedPromise(
 *         function(msg) {
 *             alert(msg);
 *         }
 *     );
 *
 *     promise.then(
 *         function() {
 *             // promise is fulfilled, no further actions can be taken
 *         }
 *     );
 *
 *     setTimeout(function() {
 *         promise.callback('hey, I\'m still busy');
 *     }, 1000);
 *
 *     setTimeout(function() {
 *         promise.fulfill();
 *     }, 2000);
 *
 * @function managedPromise
 * @param [callbackFn] {Function} invoked everytime promiseinstance.callback() is called.
 *        You may as well (re)set this method any time later by using promise.setCallback()
 * @param [stayActive=false] {Boolean} specified time to wait before the promise really gets resolved
 * @param [timeout] {Number} ms after which the Promise should be rejected by timeout: if the promise is still pending
 * @param [timeoutMsg] {String="Promise rejected by timeout"} message by which the promise will be rejected, if its is rejected by timeout
 *
 * @return {Promise} with three handles: fulfill, reject and callback.
 */
 const managedPromise = function (callbackFn, stayActive, timeout, timeoutMsg) {
    var fulfillHandler, rejectHandler, promise, finished, stayActivePromise,
        resolved, isFulfilled, isRejected;

    promise = new Promise(function (fulfill, reject) {
        fulfillHandler = fulfill;
        rejectHandler = reject;
    });

    promise.fulfill = function (value) {
        if (!resolved) {
            resolved = true;
            if (stayActivePromise) {
                stayActivePromise.then(function() {
                    finished = true;
                    fulfillHandler(value);
                });
            }
            else {
                finished = true;
                fulfillHandler(value);
            }
        }
    };

    promise.reject = function (reason) {
        if (!resolved) {
            resolved = true;
            if (stayActivePromise) {
                stayActivePromise.then(function() {
                    finished = true;
                    rejectHandler(reason);
                });
            }
            else {
                finished = true;
                rejectHandler(reason);
            }
        }
    };

    promise.isPending = function () {
        return !finished;
    };

    promise.isFulfilled = function () {
        return !!isFulfilled;
    };

    promise.isRejected = function () {
        return !!isRejected;
    };

    promise.stayActive = function (time) {
        stayActivePromise = new Promise(function (fulfill) {
            setTimeout(fulfill, time);
        });
    };

    promise.callback = function () {
        if (!finished && callbackFn) {
            callbackFn.apply(undefined, arguments);
        }
    };

    promise.setCallback = function (newCallbackFn) {
        callbackFn = newCallbackFn;
    };

    stayActive && promise.stayActive(stayActive);

    promise.then(
        function() {
            isFulfilled = true;
        },
        function() {
            isRejected = true;
        }
    );

    if (timeout) {
        later(() => {
            if (promise.isPending()) {
                promise.reject(typeof timeoutMsg === 'string' ? timeoutMsg : 'Promise rejected by timeout');
            }
        }, timeout);
    }

    return promise;
};

export default managedPromise;
