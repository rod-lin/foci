/* personal message */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var user = require("./user");

var PMsg = function (config) {
	err.assert(config.sender, "$core.pm.no_sender");
	err.assert(config.sendee, "$core.pm.no_sendee");
	err.assert(config.msg, "$core.pm.no_msg");

	this.sender = config.sender;
	this.sendee = config.sendee;
	this.msg = config.msg;

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

	conv: (uuid1, uuid2) => ({
		$or: [ { sender: uuid1, sendee: uuid2 }, { sender: uuid2, sendee: uuid1 } ]
	})
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

var hangup = {};

function resolveHangup(sender, sendee, res) {
	if (!hangup[sender]) return;

	var nlst = [];

	for (var i = 0; i < hangup[sender].length; i++) {
		if (hangup[sender][i](sendee, res)) {
			nlst.push(hangup[sender][i]);
		}
	}

	// push back the unresolved ones
	hangup[sender] = nlst;
}

// send text
exports.send = async (sender, sendee, msg) => {
	var nmsg = new PMsg({ sender: sender, sendee: sendee, msg: msg });
	var col = await db.col("pm");
	
	await col.insertOne(nmsg);

	resolveHangup(sender, sendee, [ nmsg ]);

	// await col.updateOne(user.User.query.uuid(sendee), PMsg.set.send(sender, nmsg));
	// await col.updateOne(user.User.query.uuid(sendee), PMsg.set.push_update(nmsg));
};

exports.getUpdate = async (uuid, sender, unset) => {
	var usr = await user.uuid(uuid);
	
	var col = await db.col("pm");
	// console.log(PMsg.query.update(uuid, sender, usr.pm_update || 0));
	var res = await col.find(PMsg.query.update(uuid, sender, usr.pm_update || 0)).sort({ date: -1 }).toArray();

	if (unset) exports.removeUpdate(uuid);

	return res;
};

exports.getUpdateHang = async (uuid, sender, unset, next) => {
	var usr = await user.uuid(uuid);
	
	var col = await db.col("pm");
	var res = await col.find(PMsg.query.update(uuid, sender, usr.pm_update || 0)).sort({ date: -1 }).toArray();

	if (res.length) {
		next(res);
		if (unset) exports.removeUpdate(uuid);
	} else {
		if (!hangup[sender])
			hangup[sender] = [];

		hangup[sender].push(function (sendee, res) {
			if (sendee == uuid) {
				next(res);
				if (unset) exports.removeUpdate(uuid);
			} else return true; // unresolved
		});
	}
};

exports.removeUpdate = async (uuid) => {
	var col = await db.col("user");
	// console.log(uuid);
	// set stamp to now
	await col.updateOne(user.User.query.uuid(uuid), PMsg.set.set_update_stamp(new Date()));
};

exports.getAll = async (uuid) => {
	var col = await db.col("pm");
	var res = await col.find(PMsg.query.all(uuid)).sort({ date: 1 }).toArray();
	return res;
};

exports.getConv = async (uuid, sender) => {
	var col = await db.col("pm");
	var res = await col.find(PMsg.query.conv(uuid, sender)).sort({ date: 1 }).toArray();
	return res;
};
