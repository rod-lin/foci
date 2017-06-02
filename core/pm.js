/* personal message */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var user = require("./user");

var PMsg = function (config) {
	err.assert(config.sender, "$core.pm.no_sender");
	err.assert(config.msg, "$core.pm.no_msg");

	this.sender = config.sender;
	this.msg = config.msg;

	this.format = config.format || "text"; // text, html(need authoritation), markdown, etc.
	this.date = config.date || new Date();
};

exports.PMsg = PMsg;

PMsg.query = {
	sendee: user.User.query.uuid
};

PMsg.set = {
	push_update: msg => ({
		$push: { "pm_update": msg }
	}),

	clear_update:() => ({
		$set: { "pm_update": null }
	}),

	send: (sender, msg) => {
		var q = { $push: {} };
		q.$push["pm." + sender] = msg;
		return q;
	}
};

// send text
exports.send = async (sender, sendee, msg) => {
	var nmsg = new PMsg({ sender: sender, msg: msg });
	var col = await db.col("user");
	
	await col.updateOne(PMsg.query.sendee(sendee), PMsg.set.send(sender, nmsg));
	await col.updateOne(PMsg.query.sendee(sendee), PMsg.set.push_update(nmsg));
};

exports.getUpdate = async (uuid, unset) => {
	var usr = await user.uuid(uuid);

	if (unset) exports.removeUpdate(uuid);

	return usr.pm ? usr.pm.update : null;
};

exports.removeUpdate = async (uuid) => {
	var col = await db.col("user");
	await col.updateOne(PMsg.query.sendee(uuid), PMsg.set.clear_update());
};

exports.getAll = async (uuid) => {
	var usr = await user.uuid(uuid);
	return usr.pm;
};

exports.getConv = async (uuid, sender) => {
	return (await exports.getAll(uuid))[sender];
};
