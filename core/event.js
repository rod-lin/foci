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

	this.logo = null;
	this.cover = null;

	this.title = config.def.event.title;
	this.descr = "";

	this.location = config.def.event.unsettled;
		
	// start date and end date
	this.start = null;
	this.end = null;

	// null for unlimited
	this.expect = [ null, null ];

	this.favtag = [];

	this.rating = null;

	this.staff = [];
	this.partic = []; // participants
};

exports.Event = Event;
Event.prototype = {};
Event.prototype.getEUID = function () { return this.euid };

Event.prototype.getInfo = function () {
	return {
		euid: this.euid,

		title: this.title,
		descr: this.descr,
		location: this.location,

		logo: this.logo,
		cover: this.cover,

		state: this.state,

		org: this.org,
		
		start: this.start ? this.start.getTime() : null,
		end: this.end ? this.end.getTime() : null,

		rating: this.rating,

		favtag: this.favtag,
		expect: this.expect,

		staff: this.staff,
		partic: this.partic
	};
};

Event.prototype.countPeople = function (type) {
	return this[type].length;
};

Event.prototype.getExpect = function (which) {
	return this.expect[which];
};

Event.prototype.hasPeople = function (uuid) {
	return this.partic.indexOf(uuid) != -1 || this.staff.indexOf(uuid) != -1;
};

Event.format = {};

Event.format.info = {
	title: util.checkArg.lenlim(config.lim.event.title, "title too long"),
	descr: util.checkArg.lenlim(config.lim.event.descr, "description too long"),
	location: util.checkArg.lenlim(config.lim.event.location, "location too long"),

	cover: {
		type: "string", lim: chsum => {
			if (!chsum.length > 32)
				throw new err.Exc("illegal file id");
			return chsum;
		}
	},

	logo: {
		type: "string", lim: chsum => {
			if (!chsum.length > 32)
				throw new err.Exc("illegal file id");
			return chsum;
		}
	},

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
	before: { type: "int", lim: time => new Date(time) },

	skip: { type: "int" },
	n: {
		type: "int", lim: n => {
			if (n > config.lim.event.max_search_results) {
				throw new err.Exc("too many results");
			}

			return n;
		}
	}
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
	partic: uuid => ({ "partic": uuid }),

	has_favtag: tags => ({ "favtag": { $in: tags } }),

	keyword: kw => {
		// TODO: keyword filt
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
	before: date => ({ end: { $le: date } }),

	// register for participant, next = last_index + 1, use with set.reg
	reg: (euid, next) => {
		var q = { "euid": euid };
		q["test." + next] = { $exists: 0 };
		return q;
	}
};

Event.set = {
	info: info => ({ $set: info }),
	reg: (euid, uuid, type) => {
		var q = {};
		q[type] = uuid;
		return { $push: q };
	}
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
exports.getOrganized = async (uuid, skip, lim) => {
	skip = skip || 0;
	lim = lim || config.lim.event.max_search_results;

	var col = await db.col("event");
	var arr = await col.find(Event.query.org(uuid)).skip(skip).limit(lim).toArray();
	var ret = [];

	arr.forEach(function (ev) {
		ret.push(new Event(ev).getInfo());
	});

	return ret;
};

// events participated by a user
exports.getPartic = async (uuid, skip, lim) => {
	skip = skip || 0;
	lim = lim || config.lim.event.max_search_results;

	var col = await db.col("event");
	var arr = await col.find(Event.query.partic(uuid)).skip(skip).limit(lim).toArray();
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

	var maxn = conf.n || config.lim.event.max_search_results;
	var skip = conf.skip || 0;

	var col = await db.col("event");

	var found = col.find(query);
	var count = await found.count();

	var res = await found.skip(skip).limit(maxn).toArray();
	var ret = [];

	res.forEach(ev => ret.push(new Event(ev).getInfo()));

	return ret;
};

// register as pertipants
exports.register = async (euid, uuid, type) => {
	if (type != "partic" && type != "staff")
		throw new err.Exc("illegal type");

	var ev = await exports.euid(euid);
	var next = ev.countPeople("partic");
	var expect = ev.getExpect(1);

	if (expect != null && next >= expect)
		throw new err.Exc("full participant");

	if (ev.hasPeople(uuid))
		throw new err.Exc("duplicated participant");

	var col = await db.col("event");
	var ret = await col.findOneAndUpdate(Event.query.reg(euid, next), Event.set.reg(euid, uuid, "partic"));

	if (!ret)
		throw new err.Exc("operation conflict");

	return;
};
