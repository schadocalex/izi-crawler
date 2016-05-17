"use strict";

const DataBase = require("./DataBase");
const process = require("process");

var db = new DataBase("test");
manageExit(db);

db.reset();
db.insertNode("http://url.com", "metadata");
var node = db.getNode("http://url.com");
console.log(node);
