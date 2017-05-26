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
	// this.expect = [ null, null ];

	this.apply_staff_form = null;
	this.apply_staff_lim = null;
	this.apply_staff = [];

	this.apply_partic_form = null;
	this.apply_partic_lim = null
	this.apply_partic = [];

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

		apply_num: this.countApp("staff") + this.countApp("partic"),
		rating: this.rating,

		favtag: this.favtag
	};
};

// Event.prototype.getExpect = function (which) {
// 	return this.expect[which];
// };

Event.prototype.isDraft = function () {
	return this.state === 0;
};

Event.prototype.hasApp = function (uuid) {
	var staff = this.apply_staff;

	for (var i = 0; i < staff.length; i++) {
		if (staff[i].uuid == uuid)
			return true;
	}

	var partic = this.apply_partic;

	for (var i = 0; i < partic.length; i++) {
		if (partic[i].uuid == uuid)
			return true;
	}

	return false;
};

Event.prototype.getAppForm = function (type) {
	return this["apply_" + type + "_form"];
};

Event.prototype.getAppLimit = function (type) {
	return this["apply_" + type + "_lim"];
};

Event.prototype.countApp = function (type) {
	return this["apply_" + type].length;
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

	apply_staff_lim: {
		type: "int",
		lim: val => {
			if (val != null && val < 0)
				throw new err.Exc(sth || "$core.out_of_range(staff limit)");
			return val;
		}
	},

	apply_partic_lim: {
		type: "int",
		lim: val => {
			if (val != null && val < 0)
				throw new err.Exc(sth || "$core.out_of_range(participant limit)");
			return val;
		}
	},

	apply_staff_form: util.checkArg.lenlim(config.lim.event.rform, "$core.too_long($core.word.app_form)"),
	apply_partic_form: util.checkArg.lenlim(config.lim.event.rform, "$core.too_long($core.word.app_form)"),

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
	applied: uuid => ({ $or: [ { "apply_staff.uuid": uuid }, { "apply_partic.uuid": uuid } ], "state": { $gte: 1 } }),
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

	// apply
	apply_check: (euid, type, max) => {
		var q = { "euid": euid, "state": { $gte: 1 } };
		q["apply_" + type + "." + (max - 1)] = { $exists: 0 };
		return q;
	}
};

Event.set = {
	info: info => ({ $set: info }),
	apply: (euid, uuid, type, form) => {
		var q = {};
		q["apply_" + type] = { uuid: uuid, form: form };
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

// events applied by a user
exports.getApplied = async (uuid, skip, lim) => {
	skip = skip || 0;
	lim = lim || config.lim.event.max_search_results;

	var col = await db.col("event");
	var arr = await col.find(Event.query.applied(uuid)).skip(skip).limit(lim).toArray();
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

exports.getAppForm = async (euid, type) => {
	if (type != "partic" && type != "staff")
		throw new err.Exc("$core.illegal_app_type");

	var col = await db.col("event");
	var ev = await exports.euid(euid);

	return ev.getAppForm(type);
};

// apply for partic or staff
exports.apply = async (euid, uuid, type, form) => {
	if (type != "partic" && type != "staff")
		throw new err.Exc("$core.illegal_app_type");

	form = form || null;

	var ev = await exports.euid(euid);
	var max = ev.getAppLimit(type);
	var cur = ev.countApp(type);

	if (cur >= max)
		throw new err.Exc("$core.app_full");

	if (ev.hasApp(uuid))
		throw new err.Exc("$core.dup_app");

	var col = await db.col("event");
	var ret = await col.findOneAndUpdate(Event.query.apply_check(euid, max), Event.set.apply(euid, uuid, type, form));

	if (!ret)
		throw new err.Exc("$core.app_full");

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
