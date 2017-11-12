/* personal message */

"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var util = require("./util");
var user = require("./user");
var lpoll = require("./lpoll");
var config = require("./config");

var tconv = (a, b) => a > b ? a + "." + b : b + "." + a;
var ltok = (sender, sendee) => "pm.conv." + sender + "->" + sendee;

var PMsg = function (config) {
	err.assert(config.sender, "$core.pm.no_sender");
	err.assert(config.sendee, "$core.pm.no_sendee");
	err.assert(config.msg, "$core.pm.no_msg");

	this.pmuid = config.pmuid;

	this.sender = config.sender;
	this.sendee = config.sendee;
	this.msg = config.msg;

	this.conv = tconv(this.sender, this.sendee);

	this.format = config.format || "text"; // text, html(need authoritation), markdown, etc.
	this.date = config.date || new Date();
	
	this.unread = config.unread || true;
};

exports.PMsg = PMsg;

// $or: [ { sender: uuid1, sendee: uuid2 }, { sender: uuid2, sendee: uuid1 } ],

PMsg.query = {
	update: (uuid, sender) => {
		var q = {
			sendee: uuid,
			// date: { $gt: after },
			unread: true
		};

		if (sender) q.sender = sender;

		return q;
	},

	all: uuid => ({
		$or: [ { sender: uuid }, { sendee: uuid } ]
	}),

	conv: (u1, u2, noafter) => {
		var q = { conv: tconv(u1, u2) };
		
		if (noafter) { // not include 0
			q["pmuid"] = { $lt: noafter };
		}
		
		return q;
	},

	// get the first char log of every conversation
	chat_list: uuid => [
		{ $match: { $or: [ { sender: uuid }, { sendee: uuid } ] } },
		{ $sort: { date: -1 } },
		{ $group: { _id: "$conv", first: { $first: "$$ROOT" } } }
	],
	
	after: (sender, sendee, time) => ({
		sender: sender,
		sendee: sendee,
		date: { $gt: time }
	}),
	
	before: (sender, sendee, time) => ({
		sender: sender,
		sendee: sendee,
		date: { $lte: time }
	}),
	
	after_uid: (sender, sendee, uid) => ({
		sender: sender,
		sendee: sendee,
		pmuid: { $gt: uid }
	}),
	
	before_uid: (sender, sendee, uid) => ({
		sender: sender,
		sendee: sendee,
		pmuid: { $lte: uid }
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
	
	unread: unread => ({
		$set: {
			unread: !!unread
		}
	})
};

// send text
exports.send = async (sender, sendee, msg) => {
	var nmsg = new PMsg({
		pmuid: await uid.genUID("pmuid"),
		sender: sender,
		sendee: sendee,
		msg: msg
	});
	
	var col = await db.col("pm");

	await col.insertOne(nmsg);
	
	// console.log("sender: ", sender, sendee, msg);

	await lpoll.emit(ltok(sender, sendee), [ nmsg ]);

	// await col.updateOne(user.User.query.uuid(sendee), PMsg.set.send(sender, nmsg));
	// await col.updateOne(user.User.query.uuid(sendee), PMsg.set.push_update(nmsg));
};

exports.getUpdate = async (uuid, sender) => {
	// var usr = await user.uuid(uuid);

	var col = await db.col("pm");
	// console.log(PMsg.query.update(uuid, sender, usr.pm_update || 0));
	var res = await col.find(PMsg.query.update(uuid, sender)).sort({ date: -1 }).toArray();

	// console.log(PMsg.query.update(uuid, sender));
	// exports.removeUpdate(uuid);

	return res;
};

exports.getUpdateCount = async (uuid) => {
	// var usr = await user.uuid(uuid);

	var col = await db.col("pm");
	var res = await col.find(PMsg.query.update(uuid, null)).sort({ date: -1 }).count();

	return res;
};

exports.getUpdateHang = async (uuid, sender, next) => {
	// var usr = await user.uuid(uuid);

	var col = await db.col("pm");
	var res = await col.find(PMsg.query.update(uuid, sender)).sort({ date: -1 }).toArray();

	if (res.length) {
		await exports.removeUpdate(uuid, sender);
		next(res);
	} else {
		// console.log("register " + ltok(sender, uuid));
		lpoll.off(ltok(sender, uuid));

		var timeout = setTimeout(function () {
			tick.awrap(lpoll.emit)(ltok(sender, sendee), []);
		}, config.lpoll.timeout);

		lpoll.reg(ltok(sender, uuid), async (res) => {
			// console.log("updated " + uuid + ", token: " + ltok(sender, uuid));
			clearTimeout(timeout);

			if (res.length)
				await exports.removeUpdate(uuid, sender);
	
			next(res);
		});
	}
};

// explicitly request a closing so that
// no message is marked 'read' after user closed the modal
exports.closeHang = async (uuid, sender, last_uid /* last pmuid received */) => {
	// close all listeners
	lpoll.off(ltok(sender, uuid));
	
	// console.log("closing on " + ltok(sender, uuid) + " " + ltime);
	
	if (last_uid !== 0) {
		var col = await db.col("pm");
		
		// console.log(PMsg.query.later_than(sender, uuid, ltime), PMsg.set.unread(true));
		
		// console.log(await col.find(PMsg.query.later_than(sender, uuid, ltime)).toArray());
		
		// console.log(PMsg.query.after(sender, uuid, ltime));
		
		await col.update(PMsg.query.after_uid(sender, uuid, last_uid),
						 PMsg.set.unread(true), { multi: true });
		
		await col.update(PMsg.query.before_uid(sender, uuid, last_uid),
 						 PMsg.set.unread(false), { multi: true });
	}
};

exports.removeUpdate = async (uuid, sender) => {
	// var col = await db.col("user");
	// console.log(uuid);
	// set stamp to now
	// await col.updateOne(user.User.query.uuid(uuid), PMsg.set.set_update_stamp(new Date()));

	// console.log("set read: ", uuid, "<-", sender);

	var col = await db.col("pm");
	
	await col.update(PMsg.query.update(uuid, sender),
					 PMsg.set.unread(false), { multi: true });
};

exports.getConvHead = async (uuid) => {
	var col = await db.col("pm");
	var res = await col.aggregate(PMsg.query.chat_list(uuid)).toArray();

	for (var i = 0; i < res.length; i++) {
		res[i] = res[i].first;
	}

	return res;
};

// get all message
exports.getConvAll = async (uuid, sender, noafter) => {
	var col = await db.col("pm");

	var res = await col.find(PMsg.query.conv(uuid, sender, noafter))
					   .sort({ date: -1 }) // reversed order(from newest to oldest)
					   .limit(config.lim.pm.max_conv_refresh)
					   .toArray();

	return res;
};
