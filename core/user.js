"use strict";

var db = require("./db");
var err = require("./err");
var config = require("./config");

var User = function (uuid, dname, lname, passwd) {
	err.assert(typeof uuid === "number" && uuid > 0, "illegal uuid");
	err.assert(typeof dname === "string" && dname.length <= config.lim.user.dname,
			   "illegal display name");
	err.assert(typeof lname === "string" && lname.length <= config.lim.user.lname,
			   "illegal login name");
	err.assert(typeof passwd === "string" && passwd.length == config.lim.user.passwd,
			   "illegal password checksum");

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

User.prototype = {}
User.prototype.query = {
	uuid: function (uuid) { return { "uuid": uuid } },
	lname: function (lname) { return { "lname": lname } },
	
	// fuzzy search(all)
	fuzzy: function (kw) {
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
	ftag: function (tag) {
		var reg = new RegExp(tag, "i");

		return { "favtag": { $regex: reg } };
	}
};
