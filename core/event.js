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

	this.contact = owner; // contact user

	// time created
	this.created = new Date();

	this.logo = null;
	this.cover = null;

	this.title = "";
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

	this.apply_num = 0;

	this.favtag = [];

	this.rating = null;

	this.staff = [];
	this.partic = []; // participants
};

exports.Event = Event;
Event.prototype = {};
Event.prototype.getEUID = function () { return this.euid };

Event.prototype.getInfo = function (only) {
	var all = {
		euid: this.euid,

		contact: this.contact || this.org[0],

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

		apply_num: this.apply_num,
		rating: this.rating,

		apply_staff_form: this.apply_staff_form,
		apply_partic_form: this.apply_partic_form,

		apply_staff_lim: this.apply_staff_lim,
		apply_partic_lim: this.apply_partic_lim,

		favtag: this.favtag
	};

	// only = only || {
	// 	euid: true,

	// 	title: true,
	// 	descr: true,

	// 	detail: true,

	// 	loclng: true,
	// 	loclat: true,

	// 	logo: true,
	// 	cover: true,

	// 	org: true,
		
	// 	start: true,
	// 	end: true,

	// 	apply_num: true,
	// 	rating: true,

	// 	favtag: true
	// };

	if (only) {
		var ret = {};

		for (var k in only) {
			if (only.hasOwnProperty(k) && all.hasOwnProperty(k)) {
				ret[k] = all[k];
			}
		}

		return ret;
	} else {
		return all;
	}
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

Event.prototype.getLogo = function () {
	return this.logo;
};

Event.prototype.getTitle = function () {
	return this.title;
};

Event.prototype.getAppForm = function (type) {
	return this["apply_" + type + "_form"];
};

Event.prototype.getAppLimit = function (type) {
	return this["apply_" + type + "_lim"];
};

Event.prototype.getAppList = function (type) {
	return this["apply_" + type];
};

Event.prototype.countApp = function (type) {
	return this["apply_" + type].length;
};

Event.prototype.isOrg = function (uuid) {
	return this.org.indexOf(uuid) != -1;
};

Event.format = {};

Event.format.info = {
	title: {
		type: "string", lim: title => {
			if (title.length > config.lim.event.title)
				throw new err.Exc("$core.too_long($core.word.title)");
			return title.replace(/\n/g, "");
		}
	},
	
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

Event.format.lim = {
	sort_create: {
		type: "int", lim: n => {
			if (n !== 1 && n !== -1)
				throw new err.Exc("$core.illegal($core.word.sortby)");
			return n;
		}, opt: true
	},

	sort_pop: {
		type: "int", lim: n => {
			if (n !== 1 && n !== -1)
				throw new err.Exc("$core.illegal($core.word.sortby)");
			return n;
		}, opt: true
	},

	skip: { type: "int", opt: true },
	lim: {
		type: "int", lim: n => {
			if (n > config.lim.event.max_search_results) {
				throw new err.Exc("$core.too_many($core.word.search_result)");
			}

			return n;
		}, opt: true
	}
};

Event.format.search = {
	favtag: { type: "json", lim: tags => user.checkTag(tags) },
	kw: util.checkArg.lenlim(config.lim.event.keyword, "$core.too_long($core.word.search_keyword)"),

	after: { type: "int", lim: time => new Date(time) },
	before: { type: "int", lim: time => new Date(time) }
}.extend(Event.format.lim);

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
	},

	applicant: (euid, uuid, type) => {
		var q = { "euid": euid };
		
		q["apply_" + type + ".$.status"] = { $exists: 0 };
		q["apply_" + type + ".uuid"] = uuid;

		return q;
	},

	is_applicant: (euid, uuid) => ({
		euid: euid,
		$or: [ { "apply_partic.uuid": uuid }, { "apply_staff.uuid": uuid } ]
	})
};

Event.set = {
	info: info => ({ $set: info }),
	apply: (euid, uuid, type, form) => {
		var q = {};
		q["apply_" + type] = { uuid: uuid, form: form };
		return { $push: q, $inc: { apply_num: 1 } };
	},

	publish: () => ({ $set: { state: 1 } }),
	unpublish: () => ({ $set: { state: 0 } }),

	status: (euid, status) => ({ $set: { "apply_staff.$.status": status } })
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

exports.delEvent = async (euid, uuid) => {
	var col = await db.col("event");

	await exports.checkOwner(euid, uuid);

	var found = await col.findOne(Event.query.euid(euid, 0));

	if (!found)
		throw new err.Exc("$core.not_exist($core.word.event)");

	if (found.state > 0)
		throw new err.Exc("$core.cannot_delete_published");

	await col.findOneAndDelete(Event.query.euid(euid, 0));
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

// check participant/staff
exports.checkApplicant = async (euid, uuid) => {
	var col = await db.col("event");
	if (!(await col.count(Event.query.is_applicant(euid, uuid))))
		throw new err.Exc("$core.not_event_applicant");
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

function formatStdLim(conf) {
	var query = {};

	var sortby = {
		created: -1
	};

	if (conf.sort_create) {
		sortby.created = conf.sort_create;
	}

	if (conf.sort_pop) {
		if (!conf.sort_create) delete sortby.created;
		sortby.apply_num = conf.sort_pop;
	}

	query.sortby = sortby;
	query.lim = conf.lim || config.lim.event.max_search_results;
	query.skip = conf.skip || 0;

	return query;
}

async function getEventGroup(query, conf) {
	var lim = formatStdLim(conf);

	var col = await db.col("event");
	var arr = await col.find(query)
						.sort(lim.sortby)
						.skip(lim.skip)
						.limit(lim.lim).toArray();
	var ret = [];

	arr.forEach(function (ev) {
		ret.push(new Event(ev).getInfo());
	});

	return ret;
}

// events organized by a certain user(in event info)
exports.getOrganized = async (uuid, conf) => {
	return await getEventGroup(Event.query.org(uuid), conf);
};

// events applied by a user
exports.getApplied = async (uuid, conf) => {
	return await getEventGroup(Event.query.applied(uuid), conf);
};

exports.getDraft = async (uuid, conf) => {
	return await getEventGroup(Event.query.draft(uuid), conf);
};

exports.search = async (conf, state) => {
	state = state || 1;

	var query = { "state": { $gte: 1 } };

	if (conf.favtag) query.extend(Event.query.has_favtag(conf.favtag));
	if (conf.kw) query.extend(Event.query.keyword(conf.kw));
	if (conf.after) query.extend(Event.query.after(conf.after));
	if (conf.before) query.extend(Event.query.after(conf.before));

	var col = await db.col("event");

	var lim = formatStdLim(conf);
	var res = await
		col.find(query)
			.sort(lim.sortby)
			.skip(lim.skip)
			.limit(lim.lim)
			.toArray();
	
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

	if (ev.isOrg(uuid) && !config.debug)
		throw new err.Exc("$core.app_own_event");

	if (max && cur >= max)
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
	await exports.checkOwner(euid, uuid);

	var col = await db.col("event");
	var ev = await exports.euid(euid, 0);

	if (!ev.isDraft())
		throw new err.Exc("$core.event_not_draft");

	await col.findOneAndUpdate(Event.query.euid(euid, 0), Event.set.publish());
};

exports.unpublish = async (euid, uuid) => {
	await exports.checkOwner(euid, uuid);

	var col = await db.col("event");
	var ev = await exports.euid(euid, 0);

	if (ev.isDraft())
		throw new err.Exc("$core.event_is_draft");

	await col.findOneAndUpdate(Event.query.euid(euid, 0), Event.set.unpublish());
};

// application list
exports.getAppList = async (euid, uuid, type) => {
	if (type != "partic" && type != "staff")
		throw new err.Exc("$core.illegal_app_type");

	await exports.checkOwner(euid, uuid);

	var col = await db.col("event");
	var ev = await exports.euid(euid);

	return ev.getAppList(type);
};

exports.changeAppStatus = async (euid, uuids, type, status) => {
	if (type != "partic" && type != "staff")
		throw new err.Exc("$core.illegal_app_type");

	if (status != "accept" && status != "decline")
		throw new err.Exc("$core.illegal_app_status");

	var col = await db.col("event");

	for (var i = 0; i < uuids.length; i++) {
		await col.updateOne(Event.query.applicant(euid, uuids[i], type), Event.set.status(euid, status));
	}

	return;
};
