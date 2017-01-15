/**
 * Created by Alexis on 12/05/2016.
 */

"use strict";

const DB = require('./DataBase');
const process = require("process");
const request = require("request");
const cheerio = require("cheerio");
const moment = require("moment");
const ProxyManager = require("./ProxyManager");

class Crawler {

    //////////////////////////////////////////////////
    // Database methods
    //////////////////////////////////////////////////

    /**
     *
     * @param {Object} params
     * @param {int} params.maxSimultRequest maximum amount of simultaneous request
     * @param {string} params.name name of the database
     * @param {string} params.useProxy
     * @param {Object} params.extractors functions to extract data from webpages
     * @param {Array<Object>|Object} params.starterUrls urls from which to start the crawling
     */
    constructor(params = {}) {
        this.db = new DB(params.name || ":memory:");
        this.extractors = params.extractors || {};
        this.addUrl(params.starterUrls);
        this.started = false;
        this.useProxy = params.useProxy;
        this.maxSimultRequest = params.maxSimultRequest || 1;

    }

    start() {
        if (this.started === false) {
            this.started = true;
            if (this.useProxy) {
                this.proxyManager = new ProxyManager(() => {
                    this._startCrawling();
                });
            } else {
                this._startCrawling();
            }
        }
        manageExit(this.db, this.proxyManager);
    }

    _startCrawling() {
        var url = this.db.getUnvisitedUrl();
        if (!url) {
            console.warn("Nothing to crawl. You might want to add some starter Urls.");
            process.exit();
        }
        this.timeSteps = [];
        for (var i = 0; i < this.maxSimultRequest; ++i) {
            this._crawlNext();
        }
    }

    _crawlNext() {
        var url = this.db.getUnvisitedUrl();
        if (!url) {
            console.log("nothing else to crawl.");
            process.exit();
        }
        if (this.extractors[url.type] == null) {
            console.error("There's no callback for '" + url.type + "'! You need to create one and give it to the constructor. It's izi!");
            process.exit(1);
        }

        var startTime = Date.now();

        let proxyUrl;
        let proxy;
        if (this.useProxy) {
            proxy = this.proxyManager.getProxy(),
                proxyUrl = "http://" + proxy.ipAddress + ":" + proxy.port;
        }
        try {
            request({
                uri: url.id,
                proxy: proxyUrl,
                timeout: 5000
            }, (error, response, body) => {
                if (!error && response.statusCode == 200) {

                    var extracted = this.extractors[url.type](cheerio.load(body), url.id);

                    if (extracted.isValid === false) {
                        console.log("Page invalid at : " + url.id);
                    }
                    else {
                        this.addUrl(extracted.urls);
                        this.addNode(extracted.nodes);

                        this.db.setUrlVisited(url.id);

                        this.displayProgressInfo(url.id, proxyUrl);

                        this.timeSteps.push(Date.now() - startTime);
                        if (this.timeSteps.length > 30) {
                            this.timeSteps.shift();
                        }
                    }

                    this._crawlNext();
                }
                else {
                    if (this.useProxy) {
                        this.proxyManager.blacklistProxy(proxy);
                        proxy.score--;
                        console.log("proxy " + proxyUrl + " failed from " + proxy.source + ".");
                        this._crawlNext();
                    } else {
                        throw new Error(error);
                    }
                }
            });
        }
        catch (e) {
            if (this.useProxy) {
                this.proxyManager.blacklistProxy(proxy);
                proxy.score--;
                console.log("proxy " + proxyUrl + " failed from " + proxy.source + ".");
                this._crawlNext();
            } else {
                throw new Error(e);
            }
        }
    }

    displayProgressInfo(url, proxyUrl) {
        var visitedNb = this.db.getVisitedNumber();
        var unvisitedNb = this.db.getUnvisitedNumber();
        var nbTotal = visitedNb + unvisitedNb;

        var averageRequestDuration = this.timeSteps.reduce(function (a, b) {
                return a + b;
            }, 0) / this.timeSteps.length;
        var leftTime = averageRequestDuration * unvisitedNb / this.maxSimultRequest;

        console.log("page received ( " + visitedNb + "/" + nbTotal + "  " + Math.round(visitedNb / nbTotal * 100) + "% ) : " + url);
        if (this.useProxy) console.log("Thanks to the folowing proxy : " + proxyUrl + ".");
        console.log("The crawling should be done " + moment().add(leftTime, 'ms').fromNow());
        console.log();
    }

    addUrl(url) {
        if (!url) return;

        if (Array.isArray(url)) {
            return url.map((url) => this.addUrl(url));
        }
        this.db.insertUrl(url.id, url.type);
    }

    addNode(node) {
        if (!node) return;

        if (Array.isArray(node)) {
            return node.map((url) => this.addNode(url));
        }
        let metadata;
        if (node.metadata instanceof Object || Array.isArray(node.metadata)) {
            metadata = JSON.stringify(node.metadata);
        }
        else {
            metadata = node.metadata.toString();
        }
        this.db.insertNode(node.id, metadata);
    }
}

function manageExit(db, proxyManager) {
    //process.stdin.resume();//so the program will not close instantly
    function exitHandler(err) {
        if (err) console.error(err.stack);
        db.save();
        proxyManager.saveBlacklist();
        process.exit();
    }

    process.on('exit', exitHandler);
    process.on('SIGINT', exitHandler);
    process.on('uncaughtException', exitHandler);
}

module.exports = Crawler;