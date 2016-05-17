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

        // Prepare statements
        this.nodeInsert = this.db.prepare(QUERY.NODE.INSERT);
        this.nodeGet = this.db.prepare(QUERY.NODE.GET);
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
     * Return a node ith the id
     * @param id
     */
    getNode(id) {
        return this.nodeGet.getAsObject([id]);
    }

    insertNode(id, metadata) {
        return this.nodeInsert.run([id, metadata]);
    }
}

module.exports = DataBase;