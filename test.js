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
//
// const DataBase = require('./DataBase');
//
// const db = new DataBase("test");
//
// db.insertNode("http://url.com", "metadata");
// var node = db.getNode("http://url.com");
// console.log(node);
// db.insertUrl("http://url.com", "testType");
// console.log(db.getUnvisitedUrl());
// db.setUrlVisited("http://url.com");
// console.log(db.getUnvisitedUrl());
// console.log(db.getUrl("http://url.com"));
// db.save();

const BASE_URL = "http://ludumdare.com/compo/ludum-dare-34/";

function ludum($) {
    var hubsTab = [];
    var bod = $("#compo2 p");
    var son = bod[2];
    var links = $('a', son);
    for( var i = 0; i < links.length; ++i )
    {
        if( i === links.length - 1)
            continue;
        hubsTab.push({
            id:BASE_URL + $(links[i]).attr('href'),
            type:"gameList"
        });
    }
    return {urls : hubsTab};
}

function gameList($){
    var links =[];
    var gamesTd = $(".preview td a");
    for( var i = 0; i < gamesTd.length; ++i )
    {
        var str = $(gamesTd[i]).attr("href");
        links.push({
            id: BASE_URL + str,
            type: "gamePage"
        });
    }
    return {urls : links};
}


var LUDUM_NUMBER_REGEX = /http:\/\/ludumdare.com\/compo\/ludum-dare-([0-9]+)(?:.+)/;
var LUDUM_AUTHOR_ID_REGEX = /(?:.+?)(\d+)$/;
var LUDUM_DELETE_JAM_SUFFIX_REGEX = /(.*?)(?:\([jJ]am\))?$/;
var LUDUM_MATCH_RANK_OR_IMG_REGEX = /(\d+|isilver|ibronze|igold)/;
var LUDUM_DATETIME_REGEX =/^(.*?)@ (\d*):(\d*)(am|pm)$/;

function gamePage($,_gameUrl){
    var titleBlock = $("#compo2 div h2").parent();

    var game = {
        url : _gameUrl,
        ludum : _gameUrl.match(LUDUM_NUMBER_REGEX)[1],

        title : $("h2", titleBlock).html(),
        authorID : _gameUrl.match(LUDUM_AUTHOR_ID_REGEX)[1],
        authorName : $("a > strong", titleBlock).html(),
        type : $("i", titleBlock).html(),

        categories : {},

        comments : []
    };

    //get ratings
    var ratingsBlock = $("#compo2 table tr");
    for(var i = 0; i < ratingsBlock.length; ++i )
    {
        var rank = getRank($, ratingsBlock.eq(i).children().eq(0) );
        var cat   = ratingsBlock.eq(i).children().eq(1).html().match(LUDUM_DELETE_JAM_SUFFIX_REGEX)[1];
        var score = ratingsBlock.eq(i).children().eq(2).html();
        if(cat === "Coolness")
        {
            game.coolness = score.slice(0,-1);
        }
        else
        {
            game.categories[cat] = { score : score, rank : rank};
        }
    }

    //getComments
    var comments = $(".comment");
    comments.each(function(_i,_el){
        var author = $(_el).children().eq(1).find("a");
        var authName = author.html();
        var authId = author.attr("href").match(LUDUM_AUTHOR_ID_REGEX)[1];

        var d = getDate($("div small", _el).html());
        game.comments.push({ authorId : authId, authorName : authName, date : d });
    });
    return {nodes:{id:game.url,metadata:game}};
}
function getRank($, _td )
{
    var res = _td.html().match(LUDUM_MATCH_RANK_OR_IMG_REGEX)[1];
    var val = ["igold", "isilver", "ibronze"].indexOf(res);
    return val === -1 ? res : val + 1;
}
function getDate( _d )
{
    var groups = _d.match(LUDUM_DATETIME_REGEX);
    var res = new Date(groups[1]);
    if(groups[4] === "pm")
    {
        var hour = parseInt(groups[2])+12;
        res.setHours(hour, groups[3]);
    } else
    {
        res.setHours(groups[2], groups[3]);
    }
    return res;
}


const Crawler = require('./Crawler');

let crawler = new Crawler({
    name : "LudumDare",
    extractors:{ ludum, gameList, gamePage },
    starterUrls : {
        type: "ludum",
        id:BASE_URL+"?action=preview"
    }
});

crawler.start();