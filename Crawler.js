/**
 * Created by Alexis on 12/05/2016.
 */

"use strict";

const DB = require('./DataBase');
const process = require("process");
const request = require("request");
const cheerio = require("cheerio");

class Crawler {

    //////////////////////////////////////////////////
    // Database methods
    //////////////////////////////////////////////////

    /**
     *
     * @param {Object} params
     * @param {string} params.name name of the database
     * @param {Object} params.extractors functions to extract data from webpages
     * @param {Array<Object>|Object} params.starterUrls urls from which to start the crawling
     */
    constructor(params = {}) {
        this.db = new DB(params.name || ":memory:");
        this.extractors = params.extractors || {};
        this.addUrl(params.starterUrls);
        this.started = false;
        manageExit(this.db);
    }

    start() {
        if(this.started === false) {
            this.started = true;
            this._startCrawling();
        }
    }

    _startCrawling() {
        var url = this.db.getUnvisitedUrl();
        if( !url ){
            console.warn("Nothing to crawl. You might want to add some starter Urls.");
            process.exit();
        }
        this._crawlNext();
    }

    _crawlNext(){
        var url = this.db.getUnvisitedUrl();
        if( !url ){
            console.log("nothing else to crawl.");
            process.exit();
        }
        if(this.extractors[url.type] == null) {
            console.error("There's no callback for '" + url.type + "'! You need to create one and give it to the constructor. It's izi!");
            process.exit(1);
        }
        request(url.id, (error, response, body) => {
            if (!error && response.statusCode == 200) {

                var visitedNb = this.db.getVisitedNumber();
                var unvisitedNb = this.db.getUnvisitedNumber();
                var nbTotal =  visitedNb + unvisitedNb ;

                console.log("page received ( "+ visitedNb + "/"+ nbTotal + "  "+ Math.round(visitedNb/nbTotal*100) + "% ) : "+url.id);
                console.log();
                var extracted = this.extractors[url.type](cheerio.load(body),url.id);

                if ( extracted.isValid === false )
                {
                    console.log("Page invalid at : " + url.id );
                }
                else {
                    this.addUrl(extracted.urls);
                    this.addNode(extracted.nodes);

                    this.db.setUrlVisited(url.id);
                }

                this._crawlNext();
            }
            else {
                throw new Error(error)
            }
        });
    }



    addUrl(url) {
        if( !url ) return;

        if(Array.isArray(url)) {
            return url.map((url) => this.addUrl(url));
        }
        this.db.insertUrl(url.id,url.type);
    }

    addNode(node) {
        if( !node ) return;

        if(Array.isArray(node)) {
            return node.map((url) => this.addNode(url));
        }
        let metadata;
        if( node.metadata instanceof Object || Array.isArray( node.metadata ) ){
            metadata = JSON.stringify(node.metadata);
        }
        else{
            metadata = node.metadata.toString();
        }
        this.db.insertNode(node.id,metadata);
    }
}

function manageExit(db) {
    //process.stdin.resume();//so the program will not close instantly
    function exitHandler(options, err) {
        if (options.cleanup) db.save();
        if (err) console.error(err.stack);
        if (options.exit) process.exit();
    }
    process.on('exit', exitHandler.bind(null,{cleanup:true}));
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
}

module.exports = Crawler;