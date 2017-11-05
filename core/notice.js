/* notice */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var user = require("./user");
var club = require("./club");
var event = require("./event");
var lpoll = require("./lpoll");
var cutil = require("./cutil");
var config = require("./config");

/*
	type: "event": event notice, "system": system notice, "club": club notice, "cutil": club utility
	sender: euid or system senders("helper", "welcome")

	title: title of the message

	msg: message text
	format: message format

	date: date
 */

/*

	user {
		notice: {
			"sender": [ msg1, msg2 ]
		}
	}

 */

var ltok = (event, id) => "notice." + event + "." + id;
var senduid = (type, uid) => type + "-" + uid;

var Notice = function (config) {
	err.assert(config.type, "$core.notice.no_type");
	err.assert(config.sender, "$core.notice.no_sender");
	err.assert(config.msg, "$core.notice.no_msg");

	this.type = config.type;

	this.title = config.title || "$core.notice.untitled";

	this.sender = config.sender.toString();
	this.msg = config.msg;

	this.format = config.format || "text"; // text, html(need authoritation), markdown, etc.
	this.date = config.date || new Date();
	
	this.unread = config.unread || true;
};

exports.Notice = Notice;

Notice.prototype = {};
Notice.prototype.getSenderUID = function () {
	return senduid(this.type, this.sender);
};

Notice.format = {};
Notice.format.msg = {
	type: "string",
	uuids: "array",
	
	sender: "string",
	
	title: util.checkArg.lenlim(config.lim.notice.title, "$core.too_long($core.word.title)"),
	msg: util.checkArg.lenlim(config.lim.notice.text, "$core.too_long($core.word.msg)")
};

Notice.set = {
	push: (sender, msg) => {
		var q = { $push: {} };
		q.$push["notice." + sender] = msg;
		return q;
	},

	update: (uuid, val) => {
		if (val) {
			return { $inc: { notice_update: 1 } };
		} else {
			return { $set: { notice_update: 0 } };
		}
	},
	
	read: (senduid, i) => ({
		$set: {
			["notice." + senduid + "." + i + ".unread"]: false
		}
	})
};

async function setUpdate(uuid, val) {
	var col = await db.col("user");
	await col.updateOne(user.User.query.uuid(uuid), Notice.set.update(uuid, val));
}

exports.push = async (uuid, info) => {
	var nnt = new Notice(info);
	var col = await db.col("user");
	
	var sender = nnt.getSenderUID();

	await col.updateOne(user.User.query.uuid(uuid), Notice.set.push(sender, nnt));
	await setUpdate(uuid, true);

	await lpoll.emit(ltok("update", uuid));
};

exports.pull = async (uuid) => {
	var usr = await user.uuid(uuid);
	await setUpdate(uuid, false);
	return usr.notice;
};

exports.setRead = async (uuid, type, sender, which) => {
	var col = await db.col("user");
	await col.updateOne(user.User.query.uuid(uuid), Notice.set.read(senduid(type, sender), which));
};

// get sender info
exports.info = async (type, sender) => {
	switch (type) {
		case "system":
			var found = config.notice.system[sender];
			
			if (!found) {
				throw new err.Exc("$core.not_exist($core.word.system_sender)");
			}

			return {
				url: true,
				logo: found.logo,
				name: found.name
			};

		case "event":
			var euid = parseInt(sender);
			var ev = await event.euid(euid);

			return {
				url: false,
				logo: ev.getLogo(),
				name: "$core.notice.event_notice(" + ev.getTitle() + ")"
			};

		case "cutil":
			var cuuid = parseInt(sender);
			var utl = await cutil.cuuid(cuuid);

			return {
				url: false,
				logo: utl.getCover(),
				name: "$core.notice.cutil_notice(" + utl.getName() + ")"
			};
			
		case "club":
			var cuid = parseInt(sender);
			var clb = await club.cuid(cuid);

			return {
				url: false,
				logo: clb.getLogo(),
				name: "$core.notice.club_notice(" + clb.getDName() + ")"
			};

		default:
			throw new err.Exc("$core.illegal(notice type)");
	}
};

exports.update = async (uuid) => {
	var usr = await user.uuid(uuid);
	return usr.notice_update ? usr.notice_update : 0;
};

exports.updatel = async (uuid, next) => {
	lpoll.off(ltok("update", uuid));
	lpoll.reg(ltok("update", uuid), async () => {
		next(true);
	});
};

exports.sendGroup = async (type, sender /* the claimed sender of the notice */,
						   uuid /* actual user uuid */, uuids, info) => {
	/*
		check:
		1. sender is the owner
		2. uuids are applicants to euid
	 */
	
	switch (type) {
		case "event":
			var euid = parseInt(sender);
			
			if (isNaN(euid)) {
				throw new err.Exc("$core.not_exist($core.word.event)");
			}
			
			await event.checkOwner(euid, uuid);

			for (var i = 0; i < uuids.length; i++) {
				await event.checkApplicant(euid, uuids[i]);
			}

			info.type = "event";
			info.sender = euid;
			
			break;
			
		case "club":
			var cuid = parseInt(sender);
			
			if (isNaN(cuid)) {
				throw new err.Exc("$core.not_exist($core.word.club)");
			}
			
			await club.checkAdmin(cuid, uuid);
			
			for (var i = 0; i < uuids.length; i++) {
				await club.checkRelated(cuid, uuids[i]);
			}
			
			info.type = "club";
			info.sender = cuid;
			
			break;

		case "cutil":
			info.type = "cutil";
			var cuuid = info.sender = parseInt(sender);
		
			await cutil.checkResponsible(cuuid, uuids);

			break;
			
		case "system":
			await user.checkAdmin(uuid);
			
			info.type = "system";
			info.sender = sender;
		
			break;
		
		default: throw new err.Exc("invalid sender type");
	}

	for (var i = 0; i < uuids.length; i++) {
		await exports.push(uuids[i], info);
	}
};
