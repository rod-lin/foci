// interfaces

"use strict";

var db = require("./db");
var pm = require("./pm");
var err = require("./err");
var reg = require("./reg");
var auth = require("./auth");
var user = require("./user");
var util = require("./util");
var file = require("./file");
var dict = require("./dict");
var smsg = require("./smsg");
var mail = require("./mail");
var event = require("./event");
var cover = require("./cover");
var config = require("./config");
var notice = require("./notice");
var alipay = require("./alipay");
var comment = require("./comment");
var template = require("./template");

require("./binds");

// var moment = require("moment");

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

var _cover = {};

_cover.pboard = util.route(async env => {
	env.qsuc(await cover.getPBoard());
});

var _alipay = {};

var _smsg = {};

_smsg.vercode = util.route(async env => {
	var args = util.checkArg(env.query, { "phone": "string", "forgot": { opt: true, type: "bool" } });

	if (!args.forgot) {
		await user.checkNewUserName(args.phone);
	} else {
		await user.checkUserExist(args.phone);
	}
	
	if (args.phone.length !== 11)
		throw new err.Exc("$core.smsg.wrong_phone_format");

	await smsg.sendCode(args.phone);

	env.qsuc();
});

var _mail = {};

_mail.vercode = util.route(async env => {
	var args = util.checkArg(env.query, { "email": "string", "forgot": { opt: true, type: "bool" } });

	if (!args.forgot) {
		await user.checkNewUserName(args.email);
	} else {
		await user.checkUserExist(args.email);
	}
	
	await mail.sendVercode(args.email);

	env.qsuc();
});

var _user = {};
var _pub = {};

_user.new = util.route(async env => {
	var args = util.checkArg(env.query, {
		// "dname": "string",
		"lname": "string",
		"vercode": "string",
		"pkey": "string",
		"penc": "string"
	});

	await reg.verify(args.lname, args.vercode);

	var passwd = auth.rsa.dec(args.penc, args.pkey);
	var res = await user.newUser(args.lname, args.lname, passwd);

	env.qsuc();
});

// reset password
_user.reset = util.route(async env => {
	var args = util.checkArg(env.query, {
		// "dname": "string",
		"lname": "string",
		"vercode": "string",
		"pkey": "string",
		"penc": "string"
	});
	
	await reg.verify(args.lname, args.vercode);

	var passwd = auth.rsa.dec(args.penc, args.pkey);
	var res = await user.resetPass(args.lname, passwd);

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
var T_NEED_HANG = {};

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

	var next = function (res) {
		res = JSON.stringify(res);
		res = auth.aes.enc(res, sid);
		env.qsuc(res);
	};

	var proc = encop[query.int];
	var res = await proc(env, res.usr, query, next);

	if (res !== T_NEED_HANG)
		next(res);
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

_user.search = util.route(async env => {
	var args = util.checkArg(env.query, { kw: "string" });
	env.qsuc(await user.search(args.kw));
});

_user.resume = util.route(async env => {
	var args = util.checkArg(env.query, { uuid: "int" });
	env.qsuc(await user.getResumeCache(args.uuid));
});

var _event = {};

_event.info = util.route(async env => {
	var args = util.checkArg(env.query, { "euid": "number", "only": { type: "object", opt: true } });
	var ev = await event.euid(args.euid);
	env.qsuc(ev.getInfo(args.only));
});

_event.search = util.route(async env => {
	var args = util.checkArg(env.query, event.Event.format.search, true);
	env.qsuc(await event.search(args));
});

_event.comment = util.route(async env => {
	var args = util.checkArg(env.query, { euid: "int", skip: { opt: true, type: "int" }, limit: { opt: true, type: "int" } });
	env.qsuc(await comment.get(args.euid, { skip: args.skip, limit: args.limit }));
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

exports.cover = _cover;
exports.alipay = _alipay;
exports.smsg = _smsg;
exports.mail = _mail;
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

		case "del":
			var args = util.checkArg(query, { euid: "int" });
			await event.delEvent(args.euid, usr.getUUID());
			return;

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

		case "unpublish":
			var args = util.checkArg(query, { euid: "int" });
			await event.unpublish(args.euid, usr.getUUID());
			return;

		case "terminate":
			var args = util.checkArg(query, { euid: "int" });
			await event.terminate(args.euid, usr.getUUID());
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

		case "getapp":
			var args = util.checkArg(query, { euid: "int", type: { type: "string", opt: true } });
			if (!args.type)
				return {
					staff: await event.getAppList(args.euid, usr.getUUID(), "staff"),
					staff_form: await event.getAppForm(args.euid, "staff"),

					partic: await event.getAppList(args.euid, usr.getUUID(), "partic"),
					partic_form: await event.getAppForm(args.euid, "partic")
				};
			else
				return await event.getAppList(args.euid, usr.getUUID(), args.type);

		case "appstatus":
			var args = util.checkArg(query, { euid: "int", type: "string", uuids: "array", status: "string" });
			await event.changeAppStatus(args.euid, args.uuids, args.type, args.status);

			return;

		case "view":
			var args = util.checkArg(query, { euid: "int" });
			await event.incView(args.euid, usr.getUUID());
			return;

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};

encop.pm = async (env, usr, query, next) => {
	switch (query.action) {
		case "send":
			var args = util.checkArg(query, {
				sendee: "int",
				text: util.checkArg.lenlim(config.lim.pm.text, "$core.too_long($core.word.msg)")
			});

			await pm.send(usr.getUUID(), args.sendee, args.text);

			return;

		case "gethead":
			return await pm.getConvHead(usr.getUUID());

		case "getconv":
			var args = util.checkArg(query, { sender: "int" });
			return await pm.getConvAll(usr.getUUID(), args.sender);

		case "update":
			var args = util.checkArg(query, { sender: { type: "int", opt: true } });
			return await pm.getUpdate(usr.getUUID(), args.sender);

		case "updatel":
			var args = util.checkArg(query, { sender: { type: "int", opt: true } });
			pm.getUpdateHang(usr.getUUID(), args.sender, next);

			// hang up
			return T_NEED_HANG;

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};

encop.notice = async (env, usr, query, next) => {
	switch (query.action) {
		case "pull":
			return await notice.pull(usr.getUUID());

		case "info":
			var args = util.checkArg(query, { type: "string", sender: "string" });
			return await notice.info(args.type, args.sender);

		case "update":
			return await notice.update(usr.getUUID());

		case "updatel":
			notice.updatel(usr.getUUID(), next);
			return T_NEED_HANG;

		case "send":
			var args = util.checkArg(query, {
				type: "string",
				uuids: "array", euid: "int",
				title: util.checkArg.lenlim(config.lim.notice.title, "$core.too_long($core.word.title)"),
				msg: util.checkArg.lenlim(config.lim.notice.text, "$core.too_long($core.word.msg)")
			});

			await notice.sendGroup(args.euid, usr.getUUID(), args.uuids, args);

			return;

		/*
			{
				notice: number of unread notice,
				pm: number of unread pm,
				app: number of app updates
			}
		 */
		case "getall":
			var uuid = usr.getUUID();

			var ret = {
				notice: await notice.update(uuid),
				pm: await pm.getUpdateCount(uuid),
				app: await user.getAppUpdate(uuid)
			};

			return ret;

		case "clearapp":
			await user.clearAppUpdate(usr.getUUID());
			return;

		// template
		case "temp":
			var args = util.checkArg(query, { name: "string", args: "array" });
			if (template.hasOwnProperty(args.name)) {
				return await template[args.name].apply(undefined, args.args);
			} else {
				throw new err.Exc("$core.not_exist($core.word.template)");
			}

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};

encop.comment = async (env, usr, query, next) => {
	switch (query.action) {
		case "issue":
			var args = util.checkArg(query, {
				euid: "int",
				rating: util.checkArg.posint(10, "$core.illegal($core.word.rating)").extend({ opt: true }),
				comment: util.checkArg.lenlim(config.lim.comment.text, "$core.too_long($core.word.comment)")
			});

			await comment.issue(args.euid, {
				uuid: usr.getUUID(),
				comment: args.comment,
				rating: args.rating
			});

			return;

		case "upvote":
			var args = util.checkArg(query, { euid: "int", cid: "int" });
			await comment.upvote(args.euid, args.cid, usr.getUUID());
			return;

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};

encop.cover = async (env, usr, query, next) => {
	switch (query.action) {
		case "setpboard":
			var args = util.checkArg(query, { n: "int", info: "json" });
			await cover.setPBoard(usr.getUUID(), args.n, args.info);
			return;

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};
