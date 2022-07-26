import { delay } from '../timers';
import { isObject } from 'lodash';

const RETRY_DELAY = 10000; // when socket cannot connect, the time to retry
const DEFAULT_TIMEOUT = 5000; // timeout for sendData
const NO_WEBSOCKET_SUPPORT = 'This browser does not support websockets';
const NO_URL_DEFINED = 'No websocket url defined during construction';

let browserWindow;

// eslint-disable-next-line func-names
(function (win) {
    browserWindow = win;
})(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this);

class Ws {
    constructor(url, config = {}) {
        this.url = url;
        if (typeof config.onOpen === 'function') {
            this.onOpen = config.onOpen;
        }
        if (typeof config.onData === 'function') {
            this.onData = config.onData;
        }
        if (typeof config.onClose === 'function') {
            this.onClose = config.onClose;
        }
        if (typeof config.onError === 'function') {
            this.onError = config.onError;
        }
        try {
            this.ensureConnection(); // do not await, just initialize
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
        }
    }

    connect(withDelay) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async resolve => {
            let retryConnection;

            if (withDelay) {
                await delay(RETRY_DELAY);
            }

            const onData = event => {
                if (this.onData && event.data) {
                    // try to parse the data, in case it is an object:
                    let data;
                    try {
                        data = JSON.parse(event.data);
                    } catch (err) {
                        data = event.data;
                    }
                    this.onData(data);
                }
            };

            const onClose = async (msg) => {
                retryConnection();
                this.connected = this.connect(true);
                if (this.onClose) {
                    this.onClose(msg);
                }
            };

            const onError = async (err) => {
                retryConnection();
                resolve(this.connect(true));
                if (this.onError) {
                    this.onError(err);
                }
            };

            // Connection opened
            const onOpen = () => {
                this.websocket.addEventListener('close', onClose);
                this.websocket.addEventListener('message', onData);
                resolve();
                if (this.onOpen) {
                    this.onOpen();
                }
            };

            retryConnection = () => {
                this.websocket.removeEventListener('close', onClose);
                this.websocket.removeEventListener('message', onData);
                this.websocket.removeEventListener('open', onOpen);
                this.websocket.removeEventListener('error', onError);
            };

            // Create WebSocket connection.
            try {
                this.websocket = new browserWindow.WebSocket(this.url);
            }
            catch (err) {
                onError(err);
            }
            this.websocket.addEventListener('open', onOpen);
            this.websocket.addEventListener('error', onError);
        });
    }

    async ensureConnection() {
        if (!browserWindow.WebSocket) {
            return Promise.reject(NO_WEBSOCKET_SUPPORT);
        }
        if (!this.url) {
            return Promise.reject(NO_URL_DEFINED);
        }
        if (!this.connected) {
            this.connected = this.connect();
        }
        return this.connected;
    }

    sendData(data, timeout = DEFAULT_TIMEOUT) {
        if (browserWindow.WebSocket) {
            if (isObject(data)) {
                data = JSON.stringify(data);
            }
            // eslint-disable-next-line no-async-promise-executor
            return new Promise(async (resolve, reject) => {
                let timeoutID;
                if (timeout) {
                    // eslint-disable-next-line prefer-promise-reject-errors
                    timeoutID = setTimeout(() => reject('request timeout'), timeout);
                }
                try {
                    await this.ensureConnection();
                    clearTimeout(timeoutID);
                    resolve();
                } catch (err) {
                    reject(err.message);
                }
                this.websocket.send(data);
            });
        }
        return Promise.reject(NO_WEBSOCKET_SUPPORT);
    }
}

export default Ws;
