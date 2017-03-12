"use strict";

var mongo = require("mongodb")

var config = require("./config")
var err = require("./err");

var server = new mongo.Server(config.db.url, config.db.port, config.db.opt);
var db = new mongo.Db(config.db.name, server, { save: true });

db.open();

// get collection
exports.col = async (name, cb) => {
	if (config.db.col.hasOwnProperty(name)) {
		name = config.db.col[name]; //remap
	}

	return await db.collection(name);
};
