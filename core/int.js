// interfaces

"use strict";

var db = require("./db");
var err = require("./err");
var auth = require("./auth");
var user = require("./user");
var util = require("./util");
var event = require("./event");
var config = require("./config");

var Env = require("./env").Env;

exports.auth = util.route(async env => {
	env.qsuc(auth.rsa.getAuthKey());
});

var _user = {};
var _pub = {};

_user.new = util.route(async env => {
	var args = util.checkArg(env.query, {
		// "dname": "string",
		"lname": "string",
		"pkey": "string",
		"penc": "string"
	});

	var passwd = auth.rsa.dec(args.penc, args.pkey);
	var res = await user.newUser(args.lname, args.lname, passwd);

	env.qsuc();
});

_user.login = util.route(async env => {
	var args = util.checkArg(env.query, {
		"lname": "string",
		"pkey": "string",
		"penc": "string"
	});

	var dat = auth.rsa.dec(args.penc, args.pkey);

	var sep = dat.split(":", 2);

	if (!sep[0].length || sep.length < 2)
		throw new err.Exc("wrong format");

	var tmpkey = sep[0];

	var res = await user.login(args.lname, sep[1]);

	var sid = auth.aes.enc(res.sid, tmpkey);

	// console.log(res);

	env.qsuc({
		uuid: res.uuid,
		sid: sid
	});
});

// enc "hello, foci" with the session id
_user.csid = util.route(async env => {
	var args = util.checkArg(env.query, { "uuid": "int", "enc": "string" });
	var res = await user.checkSession(args.uuid, args.enc);

	if (res.msg !== "hello")
		throw new err.Exc("wrong message");

	env.qsuc();
});

/*
	{
		int: interface name,
		<other args>
	}
 */
_user.encop = util.route(async env => {
	var args = util.checkArg(env.query, { "uuid": "int", "enc": "string" });

	var res = await user.checkSession(args.uuid, args.enc);
	
	var query;

	try {
		query = JSON.parse(res.msg);
	} catch (e) {
		throw new err.Exc("wrong encop format");
	}

	if (!query.int)
		throw new err.Exc("wrong format");

	if (!encop.hasOwnProperty(query.int))
		throw new err.Exc("no such interface");

	var proc = encop[query.int];

	return await proc(env, res.usr, query);
});

/*
	profile {
		dname,
		level,
		favtag,
		rating,

		age,
		intro,
		school
	}
 */
_user.info = util.route(async env => {
	var args = util.checkArg(env.query, { "uuid": "int" });
	var usr = await user.uuid(args.uuid);
	env.qsuc(usr.getInfo());
});

_user.org = util.route(async env => {
	var args = util.checkArg(env.query, { "uuid": "int" });
	var ret = await event.getOrganized(args.uuid);
	env.qsuc(ret);
});

var _event = {};

_event.info = util.route(async env => {
	var args = util.checkArg(env.query, { "euid": "number" });
	var ev = await event.euid(args.euid);
	env.qsuc(ev.getInfo());
});

exports.user = _user;
exports.event = _event;

/* encrypted operations */

var encop = {};

// personal info
encop.info = async (env, usr, query) => {
	switch (query.action) {
		case "get":
			env.qsuc(usr.getInfo());
			break;

		case "set":
			// format and check limit
			var setq = util.checkArg(query, user.User.infokey, true);
			await user.setInfo(usr.getUUID(), setq);
			env.qsuc();
			break;

		default:
			throw new err.Exc("no such action");
	}
};

// favtags
// encop.tag = async (env, usr, query) => {
// 	switch (query.action) {
// 		case "get":
// 			env.qsuc(usr.getTag());
// 			break;

// 		case "set":
// 			var args = util.checkArg(query, { "tag": "json" });
// 			await user.setTag(usr.getUUID(), args.tag);
// 			env.qsuc();
// 			break;

// 		default:
// 			throw new err.Exc("no such action");
// 	}
// };

// event
encop.event = async (env, usr, query) => {
	switch (query.action) {
		case "new":
			var lv = usr.getLevel();
			var after = new Date(new Date - config.lim.user.level[lv].event_interval);
			var uuid = usr.getUUID();
			var count = await event.countSponsor(uuid, after);

			if (count)
				throw new err.Exc("max event count reached");

			// console.log(count);

			var ev = await event.newEvent(uuid);

			env.qsuc(ev.getEUID());

			break;

		case "setinfo":
			// format and check limit
			var args = util.checkArg(query, { euid: "int" });
			var setq = util.checkArg(query, event.Event.infokey, true);

			await event.exist(args.euid);
			await event.setInfo(args.euid, setq);
			env.qsuc();
			break;

		default:
			throw new err.Exc("no such action");
	}
};
