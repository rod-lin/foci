"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var config = require("./config");

var User = function (uuid, dname, lname, passwd) {
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

	this.rating =  {
		tot: [ 0, 0 ],
		log: []
	};
};

User.prototype = {};

User.prototype.query = {
	uuid: uuid => ({ "uuid": uuid }),
	lname: lname => ({ "lname": lname }),
	
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

User.prototype.getUUID = function () { return this.uuid; };

exports.User = User;

exports.insertNewUser = async (dname, lname, passwd) => {
	var uuid = await uid.genUID("uuid");
	var user = new User(uuid, dname, lname, passwd);

	err.assert(user instanceof User, "not user type");

	var col = await db.col("user");
	await col.insertOne(user);

	return user;
};
