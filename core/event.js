"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var util = require("./util");
var user = require("./user");
var config = require("./config");

// event
var Event = function (euid, owner /* uuid */) {
	if (owner === undefined) {
		this.extend(euid); // extend the first argument
		return;
	}

	this.euid = euid;

	this.org = [ owner ];
	this.state = 0; // draft state

	// time created
	this.created = new Date();

	this.logo = null;
	this.cover = null;

	this.title = config.def.event.title;
	this.descr = "";

	this.detail = null;

	this.loclng = null; // longitude
	this.loclat = null; // latitude

	// start date and end date
	this.start = null;
	this.end = null;

	// null for unlimited
	//			    staff partic
	this.expect = [ null, null ];

	// register form
	//			   staff partic
	this.rform = {
		staff: null,
		partic: null
	};

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

		detail: this.detail,

		loclng: this.loclng,
		loclat: this.loclat,

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

Event.prototype.isDraft = function () {
	return this.state === 0;
};

Event.prototype.getRegForm = function (type) {
	var form = this.rform || {};
	return form[type];
};

Event.format = {};

Event.format.info = {
	title: util.checkArg.lenlim(config.lim.event.title, "$core.too_long($core.word.title)"),
	descr: util.checkArg.lenlim(config.lim.event.descr, "$core.too_long($core.word.descr)"),

	loclng: "number",
	loclat: "number",

	cover: {
		type: "string", lim: chsum => {
			if (!chsum.length > 32)
				throw new err.Exc("$core.illegal($core.word.file_id)");
			return chsum;
		}
	},

	logo: {
		type: "string", lim: chsum => {
			if (!chsum.length > 32)
				throw new err.Exc("$core.illegal($core.word.file_id)");
			return chsum;
		}
	},

	start: { type: "int", lim: time => new Date(time) },
	end: { type: "int", lim: time => new Date(time) },
	favtag: { type: "json", lim: tags => user.checkTag(tags) },

	expect: {
		type: "json", lim: expect => {
			if (expect[0] < 0 || expect[1] < 0)
				throw new err.Exc("$core.illegal_expect_partic");
		
			return [ expect[0], expect[1] ];
		}
	},

	"rform.staff": util.checkArg.lenlim(config.lim.event.rform, "$core.too_long($core.word.reg_form)"),
	"rform.partic": util.checkArg.lenlim(config.lim.event.rform, "$core.too_long($core.word.reg_form)"),

	$overall: obj => {
		if (obj.start && obj.end && obj.end <= obj.start)
			throw new err.Exc("$core.illegal($core.word.date)");
	}
};

Event.format.search = {
	favtag: { type: "json", lim: tags => user.checkTag(tags) },
	kw: util.checkArg.lenlim(config.lim.event.keyword, "$core.too_long($core.word.search_keyword)"),

	after: { type: "int", lim: time => new Date(time) },
	before: { type: "int", lim: time => new Date(time) },

	skip: { type: "int" },
	n: {
		type: "int", lim: n => {
			if (n > config.lim.event.max_search_results) {
				throw new err.Exc("$core.too_many($core.word.search_result)");
			}

			return n;
		}
	}
};

Event.query = {
	euid: (euid, state) => ({ "euid": euid, "state": { $gte: (state == undefined ? 1 : state) } /* published state */ }),

	count_owner: (uuid, after) => {
		var res = { "org.0": uuid, "state": { $gte: 1 } };

		if (after) {
			res["created"] = { $gt: after };
		}

		return res;
	},

	check_owner: (euid, uuid) => ({ "euid": euid, "org.0": uuid }),

	org: uuid => ({ "org": uuid, "state": { $gte: 1 } }),
	partic: uuid => ({ "partic": uuid, "state": { $gte: 1 } }),
	draft: uuid => ({ "org": uuid, "state": 0 }),

	has_favtag: tags => ({ "favtag": { $in: tags }, "state": { $gte: 1 } }),

	keyword: kw => {
		// TODO: keyword filt
		var reg = new RegExp(kw, "i");
		return {
			$or: [
				{ "title": { $regex: reg } },
				{ "descr": { $regex: reg } }
			],

			"state": { $gte: 1 }
		};
	},

	after: date => ({ start: { $gte: date }, "state": { $gte: 1 } }),
	before: date => ({ end: { $lte: date }, "state": { $gte: 1 } }),

	// register for participant, next = last_index + 1, use with set.reg
	reg: (euid, next) => {
		var q = { "euid": euid, "state": { $gte: 1 } };
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
	},

	publish: () => ({ $set: { state: 1 } })
};

exports.euid = async (euid, state) => {
	var col = await db.col("event");
	var found = await col.findOne(Event.query.euid(euid, state));

	if (!found)
		throw new err.Exc("$core.not_exist($core.word.event)");

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
exports.countOwn = async (uuid, after) => {
	var col = await db.col("event");
	return await col.count(Event.query.count_owner(uuid, after));
};

exports.isOwner = async (euid, uuid) => {
	var col = await db.col("event");
	return (await col.count(Event.query.check_owner(euid, uuid))) != 0;
};

exports.checkOwner = async (euid, uuid) => {
	if (!await exports.isOwner(euid, uuid))
		throw new err.Exc("$core.not_event_owner");
};

exports.exist = async (euid, state) => {
	var col = await db.col("event");
	if (!await col.count(Event.query.euid(euid, state == undefined ? 1 : state)))
		throw new err.Exc("$core.not_exist($core.word.event)");
};

exports.setInfo = async (euid, uuid, info) => {
	var col = await db.col("event");
	await exports.checkOwner(euid, uuid);
	await col.updateOne(Event.query.euid(euid, 0), Event.set.info(info));
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

exports.getDraft = async (uuid, skip, lim) => {
	skip = skip || 0;
	lim = lim || config.lim.event.max_search_results;

	var col = await db.col("event");
	var arr = await col.find(Event.query.draft(uuid)).skip(skip).limit(lim).toArray();
	var ret = [];

	arr.forEach(function (ev) {
		ret.push(new Event(ev).getInfo());
	});

	return ret;
};

exports.search = async (conf, state) => {
	state = state || 1;
	var query = { "state": { $gte: 1 } };

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

exports.getRegForm = async (euid, type) => {
	if (type != "partic" && type != "staff")
		throw new err.Exc("$core.illegal_reg_type");

	var col = await db.col("event");
	var ev = await exports.euid(euid);

	return ev.getRegForm(type);
};

// register as pertipants
exports.register = async (euid, uuid, type) => {
	if (type != "partic" && type != "staff")
		throw new err.Exc("$core.illegal_reg_type");

	var ev = await exports.euid(euid);
	var next = ev.countPeople("partic");
	var expect = ev.getExpect(1);

	if (expect != null && next >= expect)
		throw new err.Exc("$core.partic_full");

	if (ev.hasPeople(uuid))
		throw new err.Exc("$core.dup_partic");

	var col = await db.col("event");
	var ret = await col.findOneAndUpdate(Event.query.reg(euid, next), Event.set.reg(euid, uuid, "partic"));

	if (!ret)
		throw new err.Exc("$impossible(operation conflict)");

	return;
};

exports.publish = async (euid, uuid) => {
	var col = await db.col("event");

	await exports.checkOwner(euid, uuid);

	var ev = await exports.euid(euid, 0);

	if (!ev.isDraft())
		throw new err.Exc("$core.event_not_draft");

	await col.findOneAndUpdate(Event.query.euid(euid, 0), Event.set.publish());

	return;
};
