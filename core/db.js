"use strict";

var mongo = require("mongodb")

var config = require("./config")
var err = require("./err");

var server = new mongo.Server(config.db.url, config.db.port, config.db.opt);
var db = new mongo.Db(config.db.name, server);

var cols = {};

// load all renamed collections
for (var k in config.db.col) {
	if (config.db.col.hasOwnProperty(k)) {
		cols[k] = db.collection(config.db.col[k]);
	}
}

exports.cols = cols;

// get collection
exports.col = function (name, cb) {
	if (cols.hasOwnProperty(name)) {
		cb(cols[name])
	} else {
		db.collection(name, err.proc(function (col) {
			cols[name] = col;
			cb(col)
		}));
	}
};
