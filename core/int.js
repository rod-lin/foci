// interfaces

"use strict";

var db = require("./db");
var err = require("./err");
var auth = require("./auth");
var user = require("./user");
var util = require("./util");
var file = require("./file");
var dict = require("./dict");
var event = require("./event");
var config = require("./config");

var Env = require("./env").Env;

exports.auth = util.route(async env => {
	env.qsuc(auth.rsa.getAuthKey());
});

exports.favtag = util.route(async env => {
	env.qsuc(config.lim.favtag);
});

exports.dict = util.route(async env => {
	var args = util.checkArg(env.query, { "lang": "string" });

	if (!dict.hasOwnProperty(args.lang))
		throw new err.Exc("$core.dict_not_exist(" + args.lang + ")");

	env.qsuc(dict[args.lang]);
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
		throw new err.Exc("$core.wrong_login_format");

	var tmpkey = sep[0];

	var res = await user.login(args.lname, sep[1]);

	var sid = auth.aes.enc(res.sid, tmpkey);

	// console.log(res);

	env.qsuc({
		uuid: res.uuid,
		sid: sid
	});
});

// enc "hello" with the session id
_user.csid = util.route(async env => {
	var args = util.checkArg(env.query, { "uuid": "int", "enc": "string" });
	var res = await user.checkSession(args.uuid, args.enc);

	if (res.msg !== "hello")
		throw new err.Exc("$core.wrong_csid_message");

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
	var sid = res.sid;
	var query;

	try {
		query = JSON.parse(res.msg);
	} catch (e) {
		throw new err.Exc("$core.wrong_encop_format");
	}

	if (!query.int)
		throw new err.Exc("$core.wrong_encop_format");

	if (!encop.hasOwnProperty(query.int))
		throw new err.Exc("$core.int_not_exist");

	var proc = encop[query.int];
	var res = await proc(env, res.usr, query);

	res = JSON.stringify(res);
	res = auth.aes.enc(res, sid);

	env.qsuc(res);
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
	var args = util.checkArg(env.query, {}.extend(event.Event.format.lim).extend({
		"uuid": "int"
	}));

	var ret = await event.getOrganized(args.uuid, args);
	env.qsuc(ret);
});

_user.applied = util.route(async env => {
	var args = util.checkArg(env.query, {}.extend(event.Event.format.lim).extend({
		"uuid": "int"
	}));
	
	var ret = await event.getApplied(args.uuid, args);
	env.qsuc(ret);
});

var _event = {};

_event.info = util.route(async env => {
	var args = util.checkArg(env.query, { "euid": "number" });
	var ev = await event.euid(args.euid);
	env.qsuc(ev.getInfo());
});

_event.search = util.route(async env => {
	var args = util.checkArg(env.query, event.Event.format.search, true);
	env.qsuc(await event.search(args));
});

var _file = {};

_file.upload = util.route(async env => {
	if (!env.file.file)
		throw new err.Exc("no file");

	var fp = env.file.file;
	var path = fp.path;
	var ct = fp.headers["content-type"];

	var ret = await file.newFile(path, ct);

	env.qsuc(ret);
});

_file.download = util.route(async env => {
	var args = util.checkArg(env.query, { "chsum": "string" });
	var ret = await file.getFile(args.chsum);

	env.setCT(ret.ct);
	env.raw(ret.cont);
});

exports.user = _user;
exports.event = _event;
exports.file = _file;

/* encrypted operations */

var encop = {};

// personal info
encop.info = async (env, usr, query) => {
	switch (query.action) {
		case "get":
			return usr.getInfo();

		case "set":
			// format and check limit
			var setq = util.checkArg(query, user.User.format.info, true);
			await user.setInfo(usr.getUUID(), setq);
			return;

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};

encop.user = async (env, usr, query) => {
	switch (query.action) {
		case "logout":
			await user.logout(usr.getUUID());
			return;

		default:
			throw new err.Exc("$core.action_not_exist");
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
			var ev = await event.newEvent(usr.getUUID());
			return ev.getEUID();

		case "publish":
			var args = util.checkArg(query, { euid: "int" });

			var lv = usr.getLevel();
			var after = new Date(new Date - config.lim.user.level[lv].event_interval);
			var uuid = usr.getUUID();
			var count = await event.countOwn(uuid, after);

			if (count && !config.debug)
				throw new err.Exc("$core.max_event_count");

			// console.log(count);

			await event.publish(args.euid, uuid);

			return;

		case "own":
			var args = util.checkArg(query, { euid: "int" });
			return await event.isOwner(args.euid, usr.getUUID());

		case "apply":
			var args = util.checkArg(query, { euid: "int", type: "string", form: { type: "object", opt: true } });
			return await event.apply(args.euid, usr.getUUID(), args.type, args.form);

		case "draft":
			var args = util.checkArg(query, event.Event.format.lim);
			return await event.getDraft(usr.getUUID(), args);

		case "setinfo":
			// format and check limit
			var args = util.checkArg(query, { euid: "int" });
			var setq = util.checkArg(query, event.Event.format.info, true);

			await event.exist(args.euid, 0);
			await event.setInfo(args.euid, usr.getUUID(), setq);
			
			return;

		case "search":
			var args = util.checkArg(query, event.Event.format.search, true);
			return await event.search(args);

		case "rform":
			var args = util.checkArg(query, { euid: "int", type: "string" });
			return await event.getAppForm(args.euid, args.type);

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};
