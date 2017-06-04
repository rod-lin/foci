/* personal message */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var user = require("./user");
var lpoll = require("./lpoll");

var tconv = (a, b) => a > b ? a + "." + b : b + "." + a;
var ltok = (sender, sendee) => sender + "->" + sendee;

var PMsg = function (config) {
	err.assert(config.sender, "$core.pm.no_sender");
	err.assert(config.sendee, "$core.pm.no_sendee");
	err.assert(config.msg, "$core.pm.no_msg");

	this.sender = config.sender;
	this.sendee = config.sendee;
	this.msg = config.msg;

	this.conv = tconv(this.sender, this.sendee);

	this.format = config.format || "text"; // text, html(need authoritation), markdown, etc.
	this.date = config.date || new Date();
};

exports.PMsg = PMsg;


// $or: [ { sender: uuid1, sendee: uuid2 }, { sender: uuid2, sendee: uuid1 } ],

PMsg.query = {
	update: (uuid, sender, after) => {
		var q = {
			sendee: uuid,
			date: { $gt: after }
		};

		if (sender) q.sender = sender;

		return q;
	},

	all: uuid => ({
		$or: [ { sender: uuid }, { sendee: uuid } ]
	}),

	conv: (u1, u2) => ({ conv: tconv(u1, u2) }),

	// get the first char log of every conversation
	chat_list: uuid => [
		{ $match: { $or: [ { sender: uuid }, { sendee: uuid } ] } },
		{ $sort: { date: -1 } },
		{ $group: { _id: "$conv", first: { $first: "$$ROOT" } } }
	]
};

PMsg.set = {
	set_update_stamp: date => ({
		$set: { "pm_update": date }
	}),

	// send: (sender, msg) => {
	// 	var q = { $push: {} };
	// 	q.$push["pm." + sender] = msg;
	// 	return q;
	// }
};

// send text
exports.send = async (sender, sendee, msg) => {
	var nmsg = new PMsg({ sender: sender, sendee: sendee, msg: msg });
	var col = await db.col("pm");
	
	await col.insertOne(nmsg);

	lpoll.emit(ltok(sender, sendee), [ nmsg ]);

	// await col.updateOne(user.User.query.uuid(sendee), PMsg.set.send(sender, nmsg));
	// await col.updateOne(user.User.query.uuid(sendee), PMsg.set.push_update(nmsg));
};

exports.getUpdate = async (uuid, sender) => {
	var usr = await user.uuid(uuid);
	
	var col = await db.col("pm");
	// console.log(PMsg.query.update(uuid, sender, usr.pm_update || 0));
	var res = await col.find(PMsg.query.update(uuid, sender, usr.pm_update || 0)).sort({ date: -1 }).toArray();

	exports.removeUpdate(uuid);

	return res;
};

exports.getUpdateHang = async (uuid, sender, next) => {
	var usr = await user.uuid(uuid);
	
	var col = await db.col("pm");
	var res = await col.find(PMsg.query.update(uuid, sender, usr.pm_update || 0)).sort({ date: -1 }).toArray();

	if (res.length) {
		next(res);
		exports.removeUpdate(uuid);
	} else {
		lpoll.reg(ltok(sender, uuid), function (res) {
			next(res);
			exports.removeUpdate(uuid);
		});
	}
};

exports.removeUpdate = async (uuid) => {
	var col = await db.col("user");
	// console.log(uuid);
	// set stamp to now
	await col.updateOne(user.User.query.uuid(uuid), PMsg.set.set_update_stamp(new Date()));
};

exports.getConvHead = async (uuid) => {
	var col = await db.col("pm");
	var res = await col.aggregate(PMsg.query.chat_list(uuid)).toArray();

	for (var i = 0; i < res.length; i++) {
		res[i] = res[i].first;
	}

	return res;
};

exports.getConvAll = async (uuid, sender) => {
	var col = await db.col("pm");
	
	var res = await col.find(PMsg.query.conv(uuid, sender))
					   .sort({ date: 1 })
					   .toArray();
	
	return res;
};
