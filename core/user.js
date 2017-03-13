"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var util = require("./util");
var config = require("./config");

var User = function (uuid, dname, lname, passwd) {
	if (dname === undefined) {
		this.extend(uuid); // extend the first argument
		return;
	}

	err.assert(typeof uuid === "number" && uuid > 0, "illegal uuid");
	err.assert(typeof dname === "string" && dname.length <= config.lim.user.dname,
			   "illegal display name");
	err.assert(typeof lname === "string" && lname.length <= config.lim.user.lname,
			   "illegal login name");
	// err.assert(typeof passwd === "string" && passwd.length == config.lim.user.passwd,
	//		   "illegal password checksum");

	this.uuid = uuid;
	this.dname = dname;
	this.lname = lname;
	this.passwd = passwd;
	this.favtag = [];

	this.info = {
		age: NaN,
		intro: "",
		school: ""
	};

	this.rating = {
		tot: [ 0, 0 ],
		log: []
	};
};

User.prototype = {};
User.prototype.getUUID = function () { return this.uuid; };

User.query = {
	uuid: uuid => ({ "uuid": uuid }),
	lname: lname => ({ "lname": lname }),
	sid: sid => ({ "sid": sid }),

	pass: (lname, passwd) => ({ "lname": lname, "passwd": util.md5(passwd) }),
	
	// fuzzy search(all)
	fuzzy: kw => {
		var reg = new RegExp(kw, "i");
		return {
			$or: [
				{ "dname": { $regex: reg } },
				{ "lname": { $regex: reg } },
				{ "info.intro": { $regex: reg } },
				{ "info.school": { $regex: reg } }
			]
		};
	},

	// search tag(fuzzy)
	ftag: tag => {
		var reg = new RegExp(tag, "i");
		return { "favtag": { $regex: reg } };
	},

	tag: tag => ({ "favtag": tag })
};

User.set = {
	session: (sid, stamp) => ({ $set: { "sid": sid, "stamp": stamp } })
};

exports.User = User;

var genSessionID = (lname) => util.md5(Math.random().toString(), "hex");

// passwd is clear text
exports.insertNewUser = async (dname, lname, passwd) => {
	var col = await db.col("user");

	var found = await col.findOne(User.query.lname(lname));
	
	if (found) {
		throw new err.Exc("duplicated user login name");
	}

	var uuid = await uid.genUID("uuid");
	var passwd = util.md5(passwd);
	var user = new User(uuid, dname, lname, passwd);

	err.assert(user instanceof User, "not user type");

	await col.insertOne(user);

	return user;
};

// passwd is clear text
exports.checkPass = async (lname, passwd) => {
	var col = await db.col("user");
	var found = await col.findOne(User.query.pass(lname, passwd));

	if (!found) {
		throw new err.Exc("wrong username or password");
	}

	return new User(found).getUUID();
};

exports.login = async (lname, passwd) => {
	var uuid = await exports.checkPass(lname, passwd);
	var stamp = util.stamp();
	var sid = genSessionID(lname);

	var col = await db.col("user");
	await col.updateOne(User.query.uuid(uuid), User.set.session(sid, stamp));

	return sid;
};

exports.checkSession = async (sid) => {
	var col = await db.col("user");
	var res = await col.findOne(User.query.sid(sid));
	var now = util.stamp();

	if (!res)
		throw new err.Exc("invalid session id");

	if (now - res.stamp > config.lim.user.session_timeout)
		throw new err.Exc("session timeout");
};
