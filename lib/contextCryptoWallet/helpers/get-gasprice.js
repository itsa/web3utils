import toBN from '../../toBN';

const MIN_EXTRA_GAS = 10;
const MAX_EXTRA_GAS = 100;

const currentGasPrice = async (web3, extraPercentageGas) => {
    // min 10% more is needed, otherwise transactions may fail (seen with sending Coins)
    let gas = await web3.eth.getGasPrice(); // -> current gas
    if (!extraPercentageGas || extraPercentageGas < MIN_EXTRA_GAS) {
        extraPercentageGas = MIN_EXTRA_GAS;
    }
    if (extraPercentageGas > MAX_EXTRA_GAS) {
        extraPercentageGas = MAX_EXTRA_GAS;
    }
    const multiplier100 = Math.round(100 + extraPercentageGas);
    gas = toBN(gas).mul(toBN(multiplier100.toString())).div(toBN('100'));
    // eslint-disable-next-line consistent-return
    return gas;
};

export default currentGasPrice;
