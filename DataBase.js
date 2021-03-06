/**
 * Created by Alexis on 12/05/2016.
 */
"use strict";

const fs = require('fs');
const SQL = require('sql.js');

var QUERY = {
    NODE: {
        CREATE_TABLE: "CREATE TABLE IF NOT EXISTS Node (" +
        "   id          text   PRIMARY KEY," +
        "   metadata    text" +
        ")",
        TRUNCATE_TABLE: "DELETE FROM Node",
        INSERT: "INSERT INTO Node (id, metadata) VALUES(?, ?)",
        GET: "SELECT * FROM Node WHERE id = ?"
    },
    URL: {
        CREATE_TABLE: "CREATE TABLE IF NOT EXISTS Url (" +
        "   id          text    PRIMARY KEY," +
        "   type        varchar(32)," +
        "   visited     boolean" +
        ")",
        TRUNCATE_TABLE: "DELETE FROM Url",
        INSERT: "INSERT INTO Url (id, type, visited) VALUES(?, ?, 0)",
        GET: "SELECT * FROM Url WHERE id = ?",
        GET_UNVISITED: "SELECT * FROM Url WHERE visited = 0 ORDER BY RANDOM() LIMIT ?",
        SET_VISITED: "UPDATE Url SET visited = 1 WHERE id = ?"
    },
    DB: {
        VISITED_NUMBER : "SELECT count(visited) as visitedNumber from url where visited=1",
        UNVISITED_NUMBER : "SELECT count(visited) as unvisitedNumber from url where visited=0"
    }
};

function returnAsObject(obj){
    if(obj.id === undefined) {
        return undefined;
    } else {
        return obj;
    }
}

class DataBase {

    //////////////////////////////////////////////////
    // Database methods
    //////////////////////////////////////////////////

    /**
     * Create the database or load it from a file if it exists
     */
    constructor(name) {
        // Load database from file
        this.filePath = null;
        var buffer = null;
        if(name != null) {
            this.filePath = name + ".sqlite";
            try {
                buffer = fs.readFileSync(this.filePath);
            } catch(e) {
            }
        }

        // Create the database
        this.db = new SQL.Database(buffer);
        this.db.run(QUERY.NODE.CREATE_TABLE);
        this.db.run(QUERY.URL.CREATE_TABLE);

        // Prepare statements
        /**
         *
         * @type {{getNode, insertNode, getUrl, getUnvisitedUrl, insertUrl, setUrlVisited}}
         * @private
         */
        this.requests = {
            getNode : this.db.prepare(QUERY.NODE.GET),
            insertNode : this.db.prepare(QUERY.NODE.INSERT),

            getUrl : this.db.prepare(QUERY.URL.GET),
            getUnvisitedUrl : this.db.prepare(QUERY.URL.GET_UNVISITED),
            insertUrl : this.db.prepare(QUERY.URL.INSERT),
            setUrlVisited : this.db.prepare(QUERY.URL.SET_VISITED),

            getVisitedNumber : this.db.prepare(QUERY.DB.VISITED_NUMBER),
            getUnvisitedNumber : this.db.prepare(QUERY.DB.UNVISITED_NUMBER)
        };
    }

    /**
     * Remove all entries
     */
    reset() {
        this.db.run(QUERY.NODE.TRUNCATE_TABLE);
    }

    /**
     * Save the database into a file
     */
    save() {
        if(this.filePath != null) {
            var buffer = new Buffer(this.db.export());
            fs.writeFileSync(this.filePath, buffer);
        }
    }

    getVisitedNumber(){
        return this.requests.getVisitedNumber.getAsObject([]).visitedNumber;
    }

    getUnvisitedNumber(){
        return this.requests.getUnvisitedNumber.getAsObject([]).unvisitedNumber;
    }

    //////////////////////////////////////////////////
    // Nodes methods
    //////////////////////////////////////////////////

    /**
     * Return a node with the id
     * @param id
     */
    getNode(id) {
        return returnAsObject(this.requests.getNode.getAsObject([id]));
    }

    /**
     * Insert a new node in the database if not exists
     * @param id
     * @param metadata
     * @returns {*}
     */
    insertNode(id, metadata) {
        if( !this.getNode(id) ) {
            return this.requests.insertNode.run([id, metadata]);
        }
    }

    //////////////////////////////////////////////////
    // URLs methods
    //////////////////////////////////////////////////

    /**
     * Return a url with the id
     * @param id
     */
    getUrl(id) {
        return returnAsObject(this.requests.getUrl.getAsObject([id]));
    }

    /**
     * Return a unvisited url
     */
    getUnvisitedUrl() {
        return returnAsObject(this.requests.getUnvisitedUrl.getAsObject([1]));
    }

    /**
     * Insert a new url in the database if not exists
     * @param id
     * @param {string} type
     * @returns {*}
     */
    insertUrl(id, type) {
        if( !this.getUrl(id) ) {
            return this.requests.insertUrl.run([id, type]);
        }
    }

    setUrlVisited(id) {
        if( this.getUrl(id) ) {
            return this.requests.setUrlVisited.run([id]);
        }
    }
}

module.exports = DataBase;