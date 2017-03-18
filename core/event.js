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

	this.info = {
		title: config.def.event.title,
		descr: "",

		location: config.def.event.unsettled,
		
		// start date and end date
		start: null,
		end: null,

		// null for unlimited
		expect: [ null, null ],

		tag: []
	};

	this.staff = [];
	this.partic = []; // participants
};

exports.Event = Event;
Event.prototype = {};
Event.prototype.getEUID = function () { return this.euid };

Event.infokey = {
	title: util.checkArg.lenlim(config.lim.event.title, "title too long"),
	descr: util.checkArg.lenlim(config.lim.event.descr, "description too long"),
	location: util.checkArg.lenlim(config.lim.event.location, "location too long"),

	start: { type: "int", lim: time => new Date(time) },
	end: { type: "int", lim: time => new Date(time) },
	tag: { type: "origin", lim: tags => user.checkTag(tags) },

	expect: {
		type: "origin", lim: expect => {
			if (expect[0] < 0 || expect[1] < 0)
				throw new err.Exc("illegal expectations");
		
			return [ expect[0], expect[1] ];
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

	check_sponsor: (euid, uuid) => ({ "euid": euid, "org.0": uuid })
};

Event.set = {
	info: (info) => {
		var tmp = {};

		for (var k in info) {
			if (info.hasOwnProperty(k)) {
				tmp["info." + k] = info[k];
			}
		}

		return ({ $set: tmp });
	}
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

var getByEUID = async (euid, field) => {
	var col = await db.col("event");
	var res = await col.findOne(Event.query.euid(euid));
	return res[field];
};

exports.getInfo = async (euid) => await getByEUID(euid, "info");
exports.setInfo = async (euid, info) => {
	var col = await db.col("event");
	await col.updateOne(Event.query.euid(euid), Event.set.info(info));
};
