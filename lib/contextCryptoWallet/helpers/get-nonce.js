const getNonce = async (address, web3, withPending) => {
    let pending;
    if (withPending) {
        pending = 'pending';
    }
    const nonce = await web3.eth.getTransactionCount(address, pending);
    return nonce;
};

export default getNonce;
