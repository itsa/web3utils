import HardwareWallet from '../helpers/hardware-wallet-class';
import AppBtc from "@ledgerhq/hw-app-btc";
import AppEth from "@ledgerhq/hw-app-eth";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
// import TransportWebBT from "@ledgerhq/hw-transport-web-ble";

class Ledger extends HardwareWallet {
    constructor() {
        super();
        this.name = 'ledger';
    }

    async isInstalled() {
        let success;
        try {
            this.transport = await TransportWebUSB.create();
            success = true;
        }
        catch (err) {
            success = false;
        }
        return success;
    }

    async connect() {
        const instance = this;
        const success = await super.connect();
        const transport = instance.transport;
        if (success && transport) {
            instance.eth = new AppEth(transport);
            instance.btc = new AppBtc(transport);
        }
        instance.forceUpdateContext();
        return success;
    }

}

export default Ledger;
