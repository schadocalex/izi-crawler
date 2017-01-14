"use strict";

const DataBase = require('../DataBase.js');
const expect = require('chai').expect;

describe('DataBase', function(){
    let db;
   describe('constructor',function(){
       it('should create the two tables',function(){
           db = new DataBase("test");
       });
   });
    describe('.insertNode(id)',function(){
        it('should insert a node',function(){
            db.insertNode("lol","meta");
        });
    });
    describe('.getNode(id)',function(){
        it('should get the node previously created',function(){
            expect(db.getNode("lol")).to.be.instanceOf(Object);
            expect(db.getNode("lol").id).to.equal("lol");
        });
        it('should not return a node that does not exists',function(){
            expect(db.getNode("etc")).to.be.undefined;
        });
    })
});