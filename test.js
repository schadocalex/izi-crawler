"use strict";

// const iziCrawler = require("./Crawler");
//
// var izi = new iziCrawler({
//     name: "test",
//     callbacks: {
//
//     }
// });
// izi.crawl("http://theaigames.com/competitions/ultimate-tic-tac-toe/game-log/a/1");

const DataBase = require('./DataBase');

const db = new DataBase("test");

db.insertNode("http://url.com", "metadata");
var node = db.getNode("http://url.com");
console.log(node);
db.insertUrl("http://url.com", "testType");
console.log(db.getUnvisitedUrl());
db.setUrlVisited("http://url.com");
console.log(db.getUnvisitedUrl());
console.log(db.getUrl("http://url.com"));
db.save();

