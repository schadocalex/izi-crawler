const ProxyLists = require('proxy-lists');
const _ = require("lodash");

class ProxyManager {

    constructor(cb) {
        this.gettingProxies = ProxyLists.getProxies({
            protocols: ["http"],
            anonymityLevels: ["elite"]
        });
        this.gettingProxies.on('data', (data) => this._onData(data));
        this.gettingProxies.on('error', (error) => this._onError(error));
        this.gettingProxies.once('end', () => this._onEnd());

        this.cb = cb;
        this.proxies = [];
        this.i = 0;
    }

    getProxy() {
        if(this.proxies.length === 0) {
            console.error("No more proxy");
            process.exit(1);
        }

        this.i = this.i % this.proxies.length;
        let proxy = this.proxies[this.i];
        if(proxy.score <= 0) {
            this.proxies.splice(index, 1);
            return this.getProxy();
        }
        this.i++;
        return proxy;
    }

    _onData(proxies) {
        proxies.forEach(p => p.score = 1);
        this.proxies = this.proxies.concat(proxies);
    }

    _onError(error) {

    }

    _onEnd() {
        console.log("find " + this.proxies.length + " proxies");
        this.cb();
    }
}

module.exports = ProxyManager;