/**
 * Created by Alexis on 12/05/2016.
 */
"use strict";

const fs = require('fs');
const SQL = require('sql.js');

var QUERY = {
    NODE: {
        CREATE_TABLE: "CREATE TABLE IF NOT EXISTS Node (" +
        "   id          varchar(100)    PRIMARY KEY," +
        "   metadata    text" +
        ")",
        TRUNCATE_TABLE: "DELETE FROM Node",
        INSERT: "INSERT INTO Node (id, metadata) VALUES(?, ?)",
        GET: "SELECT * FROM Node WHERE id = ?"
    },
    URL: {
        CREATE_TABLE: "CREATE TABLE IF NOT EXISTS Url (" +
        "   id          varchar(255)    PRIMARY KEY," +
        "   type        varchar(32)," +
        "   visited     boolean" +
        ")",
        TRUNCATE_TABLE: "DELETE FROM Url",
        INSERT: "INSERT INTO Url (id, type, visited) VALUES(?, ?, ?)",
        GET: "SELECT * FROM Url WHERE id = ?",
        GET_VISITED: "SELECT * FROM Url WHERE visited = ? LIMIT 1"
    }
};

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
            } catch(e) {}
        }

        // Create the database
        this.db = new SQL.Database(buffer);
        this.db.run(QUERY.NODE.CREATE_TABLE);
        this.db.run(QUERY.URL.CREATE_TABLE);

        // Prepare statements
        this.nodeGet = this.db.prepare(QUERY.NODE.GET);
        this.nodeInsert = this.db.prepare(QUERY.NODE.INSERT);
        this.urlGet = this.db.prepare(QUERY.URL.GET);
        this.visitedUrlGet = this.db.prepare(QUERY.URL.GET_VISITED);
        this.urlInsert = this.db.prepare(QUERY.URL.INSERT);
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

    //////////////////////////////////////////////////
    // Nodes methods
    //////////////////////////////////////////////////

    /**
     * Return a node with the id
     * @param id
     */
    getNode(id) {
        return this.nodeGet.getAsObject([id]);
    }

    /**
     * Insert a new node in the database if not exists
     * @param id
     * @param metadata
     * @returns {*}
     */
    insertNode(id, metadata) {
        if(this.getNode(id) == null) {
            return this.nodeInsert.run([id, metadata]);
        }
    }

    //////////////////////////////////////////////////
    // URLs methods
    //////////////////////////////////////////////////

    /**
     * Return a url with the id
     * @param id
     */
    getURL(id) {
        return this.urlGet.getAsObject([id]);
    }

    /**
     * Return a unvisited url
     */
    getUnvisitedURL() {
        return this.visitedUrlGet.getAsObject([true]);
    }

    /**
     * Insert a new url in the database if not exists
     * @param id
     * @param type
     * @param visited
     * @returns {*}
     */
    insertURL(id, type, visited) {
        if(this.getURL(id).id == null) {
            visited = !!visited;
            return this.urlInsert.run([id, type, visited]);
        }
    }
}

module.exports = DataBase;