"use strict";

var db = require("./db");
var err = require("./err");

exports.genUID = async (name) => {
	var col = await db.col("uid");

	var query = { $inc: {} };
	query.$inc[name] = 1;

	var obj = await col.findOneAndUpdate({}, query, { returnOriginal: false, upsert: true });

	return obj.value[name];
};
