/* eslint max-len: 0 */

/**
 * Common Ethereum tx configuration that enables ethereum-tx to connect to the energi network.
 * Use it together with ethereumjs-tx Transaction.
 *
 * Usage:
 *
 * Tx = require('ethereumjs-tx').Transaction;
 * energiTx = require('./energi-tx');
 * energiCommon = energiTx.getCommon();
 * tx = new Tx(rawTx, {common: energiCommon});
 *
 * <i>Copyright (c) 2019 Energi Cryptocurrency - https://energi.world</i><br>
 * Proprietary License
 *
 *
 * @module energi-tx.js
 * @class getCommon
 * @since 0.0.1
*/

// see https://github.com/ethereumjs/ethereumjs-tx/blob/master/examples/custom-chain-tx.ts
// const Common = require('ethereumjs-common').default;
import Common from 'ethereumjs-common';

/**
 * Generates common transaction config that can be used by ethereumjs-tx Transaction to
 * make transactions on the Energi Gen3 network.
 *
 * @method getCommon
 * @param web3 {Object} a valid web3 instance, is needed to get the genisis block
 * @param network {String} what network the tx should connect to
 * @param networkId {String} networkid to use
 * @param chainId {String} chainid to use
 * @return {Object} common transaction configuration for the Energi Gen3 network
 * @since 0.0.1
 */
const getCommon = (web3, network, networkId, chainId) => {
    return web3.eth.getBlock(0).then(genesis => {
        return new Common({
            name: 'energi-gen3-network',
            networkId: chainId,
            chainId,
            url: network,
            genesis,
            hardforks: [{
                name: 'petersburg',
                block: 0,
                consensus: 'pos',
                finality: null
            }],
            bootstrapNodes: []
        }, 'petersburg');
    });
};

module.exports = {
    getCommon
};
