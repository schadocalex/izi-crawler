"use strict";

const iziCrawler = require("./Crawler");

var izi = new iziCrawler({
    name: "test",
    callbacks: {

    }
});
izi.crawl("http://theaigames.com/competitions/ultimate-tic-tac-toe/game-log/a/1");


//db.reset();
//db.insertNode("http://url.com", "metadata");
//var node = db.getNode("http://url.com");
//console.log(node);
