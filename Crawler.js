/**
 * Created by Alexis on 12/05/2016.
 */
"use strict";

const DB = require('./DataBase');
const process = require("process");
const request = require("request");
const $ = require("jquery");

class Crawler {

    //////////////////////////////////////////////////
    // Database methods
    //////////////////////////////////////////////////

    constructor(opt) {
        opt = opt || {};

        this.db = new DB(opt.name || ":memory:");
        this.callbacks = opt.callbacks || {};
        manageExit(this.db);
    }

    start() {
        if(this.started === false) {
            this.started = true;
            this.startCrawling();
        }
    }

    crawl(url) {
        this.addUrl(url);
        this.start();
    }

    startCrawling() {
        var url = this.db.getUnvisitedURL();
        if(this.callbacks[url.type] == null) {
            console.error("There's no callback for '" + url.type + "'! You need to create one and give it to the constructor. It's izi!");
            process.exit(1);
        }
        request(url.id, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                this.callbacks[url.type]($.parseHTML(body));
            }
        });
    }

    addUrl(URL) {
        if(Array.isArray(URL)) {
            return URL.map((URL) => this.addUrl(URL));
        }
        this.db.insertURL(URL, "type", false);
    }
}

function manageExit(db) {
    //process.stdin.resume();//so the program will not close instantly
    function exitHandler(options, err) {
        if (options.cleanup) db.save();
        if (err) console.err(err.stack);
        if (options.exit) process.exit();
    }
    process.on('exit', exitHandler.bind(null,{cleanup:true}));
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
}

module.exports = Crawler;