import { delay, later, async } from './lib/timers';
import { emailPattern } from './lib/patterns';
import {
	getNodeStyle,
	nodeBottom,
	nodeLeft,
	nodeRight,
	nodeTop,
	scrollIntoParentView,
} from './lib/dom-elements';
import cookieProperty from './lib/cookieProperty';
import copyToClipboard from './lib/copyToClipboard';
import isMobile from './lib/detectMobile';
import formatBN, { cleanCacheFormatBN } from './lib/format-bn';
import idGenerator from './lib/idGenerator';
import isNode from './lib/isNode';
import localStorage from './lib/localStorage';
import localStorageProperty from './lib/localStorageProperty';
import noCryptoWalletMsg from './lib/noCryptoWalletMsg';
import translate from './lib/translate';
import toBN, { cleanCacheToBN } from './lib/toBN';
import useIntl from './lib/useIntl';
import cryptowalletCtx, { Provider as CryptoWalletProvider} from './lib/contextCryptoWallet';
import usePrevious from './lib/usePrevious';
import websocket from './lib/websocket';
import serviceworkers from './lib/serviceworkers';
import managedPromise from './lib/managedPromise';

const { clearCachedFiles, unregisterServiceworkers, updateServiceworkers } = serviceworkers;

export {
	cleanCacheFormatBN,
	cleanCacheToBN,
	cookieProperty,
	copyToClipboard,
	delay,
	later,
	async,
	cryptowalletCtx,
	CryptoWalletProvider,
	emailPattern,
	formatBN,
	getNodeStyle,
	idGenerator,
	isMobile,
	isNode,
	localStorage,
	localStorageProperty,
	managedPromise,
	noCryptoWalletMsg,
	nodeBottom,
	nodeLeft,
	nodeRight,
	nodeTop,
	scrollIntoParentView,
	toBN,
	translate,
	useIntl,
	usePrevious,
	websocket,
	clearCachedFiles,
	unregisterServiceworkers,
	updateServiceworkers,
};
