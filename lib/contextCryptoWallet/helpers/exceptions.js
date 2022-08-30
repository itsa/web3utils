/**
 * Generates an Exception thrown by a claim error
 *
 * @method TransactionException
 * @protected
 * @param txResponse {Object} the txResponse that raised the exception
 * @since 0.0.1
 */
export const TransactionException = function(txResponse) {
    // note: do not use arrow function, because we need to maintain the right context
    let keys, l, i, key;
    this.name = 'TransactionException';
    if (typeof txResponse==='string') {
        this.message = txResponse;
    }
    else {
        this.message = 'Transaction failed';
        keys = Object.keys(txResponse);
        l = keys.length;
        i = -1;
        while (++i < l) {
            key = keys[i];
            this[key] = txResponse[key];
        }
    }
};
