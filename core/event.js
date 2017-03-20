"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var util = require("./util");
var user = require("./user");
var config = require("./config");

// event
var Event = function (euid, sponsor /* uuid */) {
	if (sponsor === undefined) {
		this.extend(euid); // extend the first argument
		return;
	}

	this.euid = euid;

	this.org = [ sponsor ];
	this.state = 0; // draft state

	// time created
	this.created = new Date();

	this.title = config.def.event.title;
	this.descr = "";

	this.location = config.def.event.unsettled;
		
	// start date and end date
	this.start = null;
	this.end = null;

	// null for unlimited
	this.expect = [ null, null ];

	this.favtag = [];

	this.staff = [];
	this.partic = []; // participants
};

exports.Event = Event;
Event.prototype = {};
Event.prototype.getEUID = function () { return this.euid };

Event.prototype.getInfo = function () {
	return {
		title: this.title,
		descr: this.descr,
		location: this.location,

		org: this.org,
		
		start: this.start ? this.start.getTime() : null,
		end: this.end ? this.end.getTime() : null,

		favtag: this.favtag,
		expect: this.expect,

		staff: this.staff,
		partic: this.partic
	};
};

Event.format = {};

Event.format.info = {
	title: util.checkArg.lenlim(config.lim.event.title, "title too long"),
	descr: util.checkArg.lenlim(config.lim.event.descr, "description too long"),
	location: util.checkArg.lenlim(config.lim.event.location, "location too long"),

	start: { type: "int", lim: time => new Date(time) },
	end: { type: "int", lim: time => new Date(time) },
	favtag: { type: "json", lim: tags => user.checkTag(tags) },

	expect: {
		type: "json", lim: expect => {
			if (expect[0] < 0 || expect[1] < 0)
				throw new err.Exc("illegal expectations");
		
			return [ expect[0], expect[1] ];
		}
	},

	$overall: obj => {
		if (obj.start && obj.end && obj.end <= obj.start)
			throw new err.Exc("illegal start or end date");
	}
};

Event.format.search = {
	favtag: { type: "json", lim: tags => user.checkTag(tags) },
	kw: util.checkArg.lenlim(config.lim.event.keyword, "keyword too long"),

	after: { type: "int", lim: time => new Date(time) },
	before: { type: "int", lim: time => new Date(time) }
};

Event.query = {
	euid: euid => ({ "euid": euid }),

	count_sponsor: (uuid, after) => {
		var res = { "org.0": uuid };

		if (after) {
			res["created"] = { $gt: after };
		}

		return res;
	},

	check_sponsor: (euid, uuid) => ({ "euid": euid, "org.0": uuid }),

	org: uuid => ({ "org": uuid }),

	has_favtag: tags => ({ "favtag": { $in: tags } }),

	keyword: kw => {
		var reg = new RegExp(kw, "i");
		return {
			$or: [
				{ "title": { $regex: reg } },
				{ "descr": { $regex: reg } },
				{ "location": { $regex: reg } }
			]
		};
	},

	after: date => ({ start: { $ge: date } }),
	before: date => ({ end: { $le: date } })
};

Event.set = {
	info: info => ({ $set: info })
};

exports.euid = async (euid) => {
	var col = await db.col("event");
	var found = await col.findOne(Event.query.euid(euid));

	if (!found)
		throw new err.Exc("no such event");

	return new Event(found);
};

exports.newEvent = async (uuid) => {
	var euid = await uid.genUID("euid");
	var nev = new Event(euid, uuid);
	var col = await db.col("event");

	await col.insertOne(nev);

	return nev;
};

// count how many times has a user created a event(after a certain date)
// after is optional
exports.countSponsor = async (uuid, after) => {
	var col = await db.col("event");
	return await col.count(Event.query.count_sponsor(uuid, after));
};

exports.isSponsor = async (euid, uuid) => {
	var col = await db.col("event");
	return (await col.count(Event.query.check_sponsor(euid, uuid))) != 0;
};

exports.exist = async (euid) => {
	var col = await db.col("event");
	if (!await col.count(Event.query.euid(euid)))
		throw new err.Exc("event not exist");
};

exports.setInfo = async (euid, info) => {
	var col = await db.col("event");
	await col.updateOne(Event.query.euid(euid), Event.set.info(info));
};

// events organized by a certain user(in event info)
exports.getOrganized = async (uuid) => {
	var col = await db.col("event");
	var arr = await col.find(Event.query.org(uuid)).toArray();
	var ret = [];

	arr.forEach(function (ev) {
		ret.push(new Event(ev).getInfo());
	});

	return ret;
};

exports.search = async (conf) => {
	var query = {};

	if (conf.favtag) query.extend(Event.query.has_favtag(conf.favtag));
	if (conf.kw) query.extend(Event.query.keyword(conf.kw));
	if (conf.after) query.extend(Event.query.after(conf.after));
	if (conf.before) query.extend(Event.query.after(conf.before));

	var col = await db.col("event");
	var res = await col.find(query).toArray();
	var ret = [];

	res.forEach(ev => ret.push(new Event(ev).getInfo()));

	return ret;
};