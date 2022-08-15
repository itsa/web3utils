import MetaMask from './metamask';

class Brave extends MetaMask {
    constructor() {
        super();
        const instance = this;
        this.refresh = this.refresh.bind(this);
        instance.name = 'brave';
    }

}

export default Brave;
