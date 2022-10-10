const SEVERITIES = {
    '-2': 'signed', // event that will be send by wallet devices whenever a transaction is successfully signed
    '-1': 'cleanup', // event that will be send by wallet devices whenever a previous message should be cleaned up
    0: 'success',
    1: 'info',
    2: 'warning',
    3: 'error',
};

export default SEVERITIES;
