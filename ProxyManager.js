const ProxyLists = require('proxy-lists');
const _ = require("lodash");
const fs = require('fs-extra');
const moment = require('moment');

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

        fs.ensureFileSync('proxyBlacklist.json');

        let obj = fs.readJsonSync('proxyBlacklist.json', {throws: false});
        if(obj) {
            this.blacklist = obj;
        }
        else{
            this.blacklist = {};
        }

        this.blacklistCounter = 0;
    }

    getProxy() {
        if(this.proxies.length === 0) {
            console.error("No more proxy");
            process.exit(1);
        }

        this.i = this.i % this.proxies.length;
        let proxy = this.proxies[this.i];
        if(proxy.score <= 0) {
            this.blacklist["http://" + proxy.ipAddress + ":" + proxy.port] = Date.now() + moment.duration(1,"days").valueOf();
            this.proxies.splice(index, 1);
            return this.getProxy();
        }
        this.i++;
        return proxy;
    }

    blacklistProxy(proxy)
    {
        this.blacklist["http://" + proxy.ipAddress + ":" + proxy.port] = Date.now() + moment.duration(1,"days").valueOf();
        let proxyIndex = _.indexOf(this.proxies,proxy);
        if( proxyIndex != -1 )
        {
            this.proxies.splice(proxyIndex, 1);
        }
    }

    _onData(proxies) {
        proxies.filter( (p) => {
            let bl = this.blacklist[p];
            if(!bl || bl < Date.now()) {
                p.score = 1;
                return true;
            }
            this.blacklistCounter++;
            return false;
        });
        this.proxies = this.proxies.concat(proxies);
    }

    _onError(error) {

    }

    _onEnd() {
        console.log("find " + this.proxies.length + " proxies ("  + this.blacklistCounter + " proxies discarded from blacklist).");
        this.cb();
    }

    saveBlacklist()
    {
        fs.outputJsonSync('proxyBlacklist.json', this.blacklist);
    }
}

module.exports = ProxyManager;