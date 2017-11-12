// interfaces

"use strict";

var db = require("./db");
var pm = require("./pm");
var err = require("./err");
var reg = require("./reg");
var auth = require("./auth");
var user = require("./user");
var club = require("./club");
var util = require("./util");
var file = require("./file");
var dict = require("./dict");
var smsg = require("./smsg");
var mail = require("./mail");
var mcom = require("./mcom");
var cutil = require("./cutil");
var event = require("./event");
var cover = require("./cover");
var config = require("./config");
var notice = require("./notice");
var alipay = require("./alipay");
var wechat = require("./wechat");
var forumi = require("./forumi");
var captcha = require("./captcha");
var comment = require("./comment");
var invcode = require("./invcode");
var template = require("./template");
var watchdog = require("./watchdog");

// var request = require("request");

require("./binds");

// returns: -1 for no captcha but good, 0 for not good, 1 for has captcha
var checkCaptcha = async (env) => {
	var args = util.checkArg(env.query, {});
	// capans is automatically scanned
	var ret = await captcha.check(env, () => watchdog.testTraffic(env.ip()), args.capans);

	if (ret == 1) // has captcha
		watchdog.clearTrafficFor(env.ip());

	return ret;
};

// var moment = require("moment");

var Env = require("./env").Env;

exports.auth = util.route(async env => {
	env.qsuc(auth.rsa.getAuthKey());
});

exports.favtag = util.route(async env => {
	env.qsuc(config.lim.favtag);
});

exports.dict = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	
	var args = util.checkArg(env.query, { "lang": "string" });

	if (!dict.hasOwnProperty(args.lang))
		throw new err.Exc("$core.dict_not_exist(" + args.lang + ")");

	env.qsuc(dict[args.lang]);
});

var _mcom = {};

// ?coms="a,b,c,d,e"
_mcom.merge = util.route(async env => {
	var args = util.checkArg(env.query, { "coms": "string" });
	var coms = args.coms.split(",");

	var res = await mcom.merge(coms);

	env.setCT("text/javascript");
	env.setExpire(config.mcom.client_expire, res.modified);
	env.raw(res.src);
});

// ?part="abc/ss"
_mcom.mpart = util.route(async env => {
	var args = util.checkArg(env.query, { "part": "string" });

	var res = await mcom.mpart(args.part);

	env.setExpire(config.mcom.client_expire, res.modified);
	env.raw(res.src);
});

// ?files="abc/ss,abc/sss"
_mcom.mcss = util.route(async env => {
	var args = util.checkArg(env.query, { "files": "string" });
	var files = args.files.split(",");

	var res = await mcom.mcss(files);

	env.setCT("text/css");
	env.setExpire(config.mcom.client_expire, res.modified);
	env.raw(res.src);
});

var _cover = {};

_cover.pboard = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	env.qsuc(await cover.getPBoard());
});

var _alipay = {};

var _smsg = {};

_smsg.vercode = util.route(async env => {
	var args = util.checkArg(env.query, { "phone": "string", "forgot": { opt: true, type: "bool" } });

	if (!await captcha.check(env, () => false, args.capans)) return;

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

var _bugi = {};

_bugi.report = util.route(async env => {
	var args = util.checkArg(env.query, { "time": "int", "report": "string" });

	await mail.send(config.bugi.receiver, "Bugi - Report - " + args.time,
					await template.bug_report(args.report, args.time, env));

	env.qsuc();
});

var _mail = {};

_mail.vercode = util.route(async env => {
	var args = util.checkArg(env.query, { "email": "string", "forgot": { opt: true, type: "bool" } });

	if (!await captcha.check(env, () => util.coin(0.4), args.capans)) return;

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
	if (!await checkCaptcha(env)) return;
	
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
	if (!await checkCaptcha(env)) return;
	
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
	if (!await checkCaptcha(env)) return;
	
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
		sid: sid,
		admin: await user.isAdmin(res.uuid),
		root: await user.isRoot(res.uuid),
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
const T_NEED_HANG = {};
const T_NEED_CAP = {};
const T_HAS_HANDLED = {};

_user.encop = util.route(async env => {
	var check_res = await checkCaptcha(env);
	// console.log(check_res);
	if (!check_res) return;
	
	var args = util.checkArg(env.query, { "uuid": "int", "enc": "string" });

	// if (!await captcha.check(env, () => {}, args.capans)) return;

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
	
	var res = await proc(env, res.usr, query, next, check_res == 1);

	switch (res) {
		// hangup for future messages
		case T_NEED_HANG:
			// temp fix for the duplicated request issue
			// https://github.com/expressjs/express/issues/2512
			// probably a node bug?
			env.setTimeout(60 * 10 * 1000);
			break;

		case T_HAS_HANDLED:
			break;
		
		// need captcha
		case T_NEED_CAP:
			env.qcap(await captcha.register(env.ip()));
			break;
		
		default:
			next(res);
	}
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
	if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, { "uuid": "int" });
	var usr = await user.uuid(args.uuid);

	env.qsuc(usr.getInfo());
});

_user.rating = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, { "uuid": "int" });
	
	env.qsuc(await user.calRating(args.uuid));
});

_user.org = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, util.extend({ "uuid": "int" }, event.Event.format.lim));

	var ret = await event.getOrganized(args.uuid, args);
	env.qsuc(ret);
});

_user.applied = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, util.extend({ "uuid": "int" }, event.Event.format.lim));

	var ret = await event.getApplied(args.uuid, args);
	env.qsuc(ret);
});

_user.search = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, { kw: "string" });
	env.qsuc(await user.search(args.kw));
});

_user.resume = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, { uuid: "int" });
	env.qsuc(await user.getResumeCache(args.uuid));
});

_user.realname = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, { uuid: "int" });
	env.qsuc(await user.isRealname(args.uuid));
});

var _event = {};

_event.info = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, { "euid": "number", "only": { type: "json", opt: true } });
	var ev = await event.euid(args.euid);
	env.qsuc(ev.getInfo(args.only));
});

_event.search = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, event.Event.format.search, true);
	env.qsuc(await event.search(args));
});

_event.comment = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	
	var args = util.checkArg(env.query, {
		"hot": { type: "bool", opt: true },
		"euid": "int", "skip": { opt: true, type: "int" },
		"limit": { opt: true, type: "int" }
	});
	
	env.qsuc(await comment.get(args.euid, {
		skip: args.skip, limit: args.limit,
		hot: args.hot
	}));
});

var _club = {};

_club.info = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	
	var args = util.checkArg(env.query, { "cuid": "int" });
	var clb = await club.cuid(args.cuid);
	
	env.qsuc(clb.getInfo());
});

_club.search = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	
	var args = util.checkArg(env.query, { "kw": "string" });
	
	env.qsuc(await club.search(null, { kw: args.kw }));	
});

_club.org = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	
	var args = util.checkArg(env.query, util.extend({ "cuid": "int" }, event.Event.format.lim));
	
	env.qsuc(await event.getClubOrganized(args.cuid, args));	
});

_club.related = util.route(async env => {
	if (!await checkCaptcha(env)) return;
	
	var args = util.checkArg(env.query, { "uuid": "int" });

	env.qsuc(await club.getRelatedClub(args.uuid, true));	
});

var _file = {};

_file.upload = util.route(async env => {
	// if (!await checkCaptcha(env)) return;
	// forced captcha check
	var args = util.checkArg(env.query, { "tmp": { type: "bool", opt: true } });

	if (!args.tmp) // not temp file
		if (!await captcha.check(env, () => util.coin(0.5 /* 50% possibility to trigger */), args.capans)) return;
	
	if (!env.file.file)
		throw new err.Exc("no file");

	var fp = env.file.file;
	var path = fp.path;
	var ct = fp.headers["content-type"];
	
	if (config.file.allowed_ct && config.file.allowed_ct.indexOf(ct) == -1) {
		throw new err.Exc("$core.illegal_upload_type");
	}

	var ret = await file.newFile(path, ct, args.tmp);

	env.qsuc(ret);
});

_file.download = util.route(async env => {
	// if (!await checkCaptcha(env)) return;
	
	var args = util.checkArg(env.query, {
		"chsum": "string",
		"tmp": { type: "bool", opt: true }
	});

	var imgstyle = util.checkArg(env.query, file.format.imgstyle, true);
	
	var ret = await file.getFile(args.chsum, util.extend({ tmp: args.tmp }, imgstyle));

	if (ret.redir) {
		// TODO: content type?
		env.redir(ret.redir);
	} else {
		if (ret.ct)
			env.setCT(ret.ct);
		env.raw(ret.cont);
	}
});

_file.derefer = util.route(async env => {
	// if (!await checkCaptcha(env)) return;
	var args = util.checkArg(env.query, { "url": "string", "type": "string" });
	var imgstyle = util.checkArg(env.query, file.format.imgstyle, true);
	await file.derefer(args.url, args.type, env, imgstyle);
});

var _cutil = {};

_cutil.all = util.route(async env => {
	if (!await checkCaptcha(env)) return;

	var args = util.checkArg(env.query, { "show_disabled": "bool" });

	env.qsuc(await cutil.getAllUtil(args.show_disabled));
});

exports.mcom = _mcom;
exports.cover = _cover;
exports.alipay = _alipay;
exports.bugi = _bugi;
exports.smsg = _smsg;
exports.mail = _mail;
exports.user = _user;
exports.event = _event;
exports.club = _club;
exports.file = _file;
exports.cutil = _cutil;

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
			
		case "realname":
			var args = util.checkArg(query, {
				uuid: "int", euid: { type: "int", opt: true }
			});
			
			if (usr.getUUID() != args.uuid &&
				!await user.isAdmin(usr.getUUID())) {
				// is the viewer allowed to view the real name
				await event.checkOwner(args.euid, usr.getUUID());
				await event.checkApplicant(args.euid, args.uuid);
			}
			
			var dest = await user.uuid(args.uuid);
			
			return dest.getRealname();

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};

encop.user = async (env, usr, query) => {
	switch (query.action) {
		case "logout":
			await user.logout(usr.getUUID());
			return;
			
		case "ratestaff":
			var args = util.checkArg(query, {
				euid: "int", /* related event */
				uuids: "array", /* staff to rate */
				rating: util.checkArg.posint(10)
			});
			
			await user.checkUUIDs(args.uuids);
			await user.rateStaff(args.euid, usr.getUUID(), args.uuids, args.rating);
			
			return;
			
		case "resetpass":
			var args = util.checkArg(query, {
				oldpass: "string",
				newpass: "string"
			});
			
			await user.checkPass(usr.getLName(), args.oldpass);
			await user.resetPass(usr.getLName(), args.newpass);

			return;
			
		case "submitrealname":
			var args = util.checkArg(query, {
				name: "string",
				school: "string",
				grade: "int",
				
				invcode: {
					type: "string",
					opt: true
				}
			});
		
			return await user.checkRealname(usr.getUUID(), args);
			
		case "resetrealname":
			await user.resetRealname(usr.getUUID());
			return;

		case "geninvcode":
			var args = util.checkArg(query, {
				type: "string",
				number: util.checkArg.posint(128, "too many invcode to generate"),
				limit: "int"
			});
			
			await user.checkAdmin(usr.getUUID());
			
			var ret = [];
			
			for (var i = 0; i < args.number; i++) {
				ret.push({
					code: await invcode.insertInvcode(args.type, { valid: args.limit }),
					type: args.type,
					limit: args.limit
				});
			}
			
			return ret;

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
encop.event = async (env, usr, query, next, has_cap) => {
	switch (query.action) {
		case "info":
			var args = util.checkArg(query, { euid: "int", state: { type: "int", opt: true } });
			
			// only admin/organizers can see all events
			// await user.checkAdmin(usr.getUUID());
			await event.checkOwner(args.euid, usr.getUUID());
			
			return (await event.euid(args.euid, args.state)).getInfo();
		
		case "new":
			var info = util.checkArg(query, event.Event.format.info, true);
			var uuid = usr.getUUID();
			
			if (!await user.isAdmin(uuid)) {
				var count = await event.countUnpublished(uuid);
				
				if (count >= config.lim.event.max_draft_num) {
					throw new err.Exc("$core.too_many_drafts");
				}
				
				if (!has_cap && count >= config.lim.event.max_safe_draft_num) {
					return T_NEED_CAP;
				}
			}
		
			var ev = await event.newEvent(uuid, info);
			
			return ev.getInfo();

		case "del":
			var args = util.checkArg(query, { euid: "int" });
			await event.delEvent(args.euid, usr.getUUID());
			return;

		case "publish":
			var args = util.checkArg(query, { euid: "int" });
			await event.publish(args.euid, usr.getUUID());
			return;
			
		case "setreview":
			var args = util.checkArg(query, { euid: "int" });

			var lv = usr.getLevel();
			var after = new Date(new Date - config.lim.user.level[lv].event_interval);
			var uuid = usr.getUUID();
			var count = await event.countOwn(uuid, after);

			if (count && !config.debug)
				throw new err.Exc("$core.max_event_count");

			// console.log(count);

			await event.markReview(args.euid, uuid);

			return;
			
		case "review":
			var args = util.checkArg(query, event.Event.format.lim);
			await user.checkAdmin(usr.getUUID());
			return await event.getReview(usr.getUUID(), args);

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
			var args = util.checkArg(query, { euid: "int", type: "string", form: { type: "json", opt: true } });
			return await event.apply(args.euid, usr.getUUID(), args.type, args.form);

		case "draft":
			var args = util.checkArg(query, event.Event.format.lim);
			return await event.getDraft(usr.getUUID(), args);

		case "setinfo":
			// format and check limit
			var args = util.checkArg(query, { euid: "int" });
			var setq = util.checkArg(query, event.Event.format.info, true);

			await event.exist(args.euid, event.evstat.all);
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

encop.wechat = async (env, usr, query, next, has_cap) => {
	switch (query.action) {
		case "article":
			var args = util.checkArg(query, { code: "string" }); // the path following https://mp.wechat.qq.com/

			if (!has_cap)
				if (!await captcha.check(env, () => util.coin(1))) return T_HAS_HANDLED;

			return await wechat.getArticleContent(args.code);
			
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
			var args = util.checkArg(query, { sender: "int", noafter: "int" });
			return await pm.getConvAll(usr.getUUID(), args.sender, args.noafter);

		case "update":
			var args = util.checkArg(query, { sender: { type: "int", opt: true } });
			return await pm.getUpdate(usr.getUUID(), args.sender);

		case "updatel":
			var args = util.checkArg(query, { sender: { type: "int", opt: true } });
			await pm.getUpdateHang(usr.getUUID(), args.sender, next);

			// hang up
			return T_NEED_HANG;
			
		case "setread":
			var args = util.checkArg(query, { sender: "int" });
			await pm.removeUpdate(usr.getUUID(), args.sender);
			
			return;
			
		case "closel":
			var args = util.checkArg(query, { sender: "int", luid: "int" });
			await pm.closeHang(usr.getUUID(), args.sender, args.luid);

			return;

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
			var args = util.checkArg(query, notice.Notice.format.msg);
			
			await notice.sendGroup(args.type, args.sender, usr.getUUID(), args.uuids, args);

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
			
		case "setread":
			var args = util.checkArg(query, { type: "string", sender: "string", which: "int"});
			await notice.setRead(usr.getUUID(), args.type, args.sender, args.which);
			return;

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};

encop.comment = async (env, usr, query, next) => {
	switch (query.action) {
		case "issue":
			var args = util.checkArg(query, {
				euid: "int",
				rating: util.extend(util.checkArg.posint(10, "$core.illegal($core.word.rating)"), { opt: true }),
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

		// remove upvote
		case "remupvote":
			var args = util.checkArg(query, { euid: "int", cid: "int" });
			await comment.removeUpvote(args.euid, args.cid, usr.getUUID());
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

encop.club = async (env, usr, query, next) => {
	switch (query.action) {
		case "new":
			var args = util.checkArg(query, {
				dname: "string",
				type: "int",
				descr: "string",
				
				school: {
					type: "string",
					opt: true
				},
				
				invcode: {
					type: "string",
					opt: true
				},
				
				cuid: { // if given, the club should already exist
					type: "int",
					opt: true
				}
			});
			
			// check invcode first
			if (args.invcode) {
				if (!await invcode.findInvcode("clubreg", args.invcode))
					throw new err.Exc("$core.invalid_invcode");
			}
			
			// allow other trivial settings too
			var info = util.checkArg(query, club.Club.format.info, true);
			
			var cuid;
			
			if (args.cuid === undefined) {
				cuid = (await club.newClub(usr.getUUID(), info)).getCUID();
			} else {
				cuid = args.cuid;
				await club.updateReviewInfo(cuid, usr.getUUID(), info);
				await club.setState(cuid, club.clubstat.review);
			}
				
			var published = false;
			
			// check invitation code
			if (args.invcode) {
				await club.publish(cuid, null, true);
				await invcode.invalidate("clubreg", args.invcode);
				published = true;
			}
			
			return {
				cuid: cuid,
				published: published
			};
			
		case "publish":
			var args = util.checkArg(query, { cuid: "int" });
			await club.publish(args.cuid, usr.getUUID());
			return;
			
		case "publishall":
			var args = util.checkArg(query, { cuids: "array" });
			await club.publishAll(args.cuids, usr.getUUID());
			return;
			
		case "reject":
			var args = util.checkArg(query, { cuid: "int" });
			await club.reject(args.cuid, usr.getUUID());
			return;
			
		case "rejectall":
			var args = util.checkArg(query, { cuids: "array" });
			await club.rejectAll(args.cuids, usr.getUUID());
			return;
			
		case "getreview":
			// var args = util.checkArg(query, {});
			await user.checkAdmin(usr.getUUID());
			return await club.getReview();
			
		case "applyjoin":
			var args = util.checkArg(query, { cuid: "int", comment: "string" });
			await club.applyMember(args.cuid, usr.getUUID(), args.comment);
			return;
			
		case "changeapply":
			var args = util.checkArg(query, { cuid: "int", uuid: "int", accept: "bool" });
			await club.changeApply(args.cuid, usr.getUUID(), args.uuid, args.accept);
			return;
			
		case "getrelated":
			return await club.getRelatedClub(usr.getUUID());
			
		case "relation":
			var args = util.checkArg(query, { cuid: "int", uuid: { type: "int", opt: true } });
			return (await club.cuid(args.cuid))
				   .getRelation(args.uuid !== undefined ? args.uuid : usr.getUUID());
			
		case "delete":
			var args = util.checkArg(query, { cuid: "int" });
			await club.delete(args.cuid, usr.getUUID());
			return;
			
		case "search":
			var args = util.checkArg(query, { kw: "string" });
			return await club.search(usr.getUUID(), { kw: args.kw });
			
		case "member":
			var args = util.checkArg(query, { cuid: "int" });
			return await club.getMember(args.cuid, await club.isAdmin(args.cuid, usr.getUUID()));
		
		case "onemember":
			var args = util.checkArg(query, { cuid: "int", uuid: "int" });
			return await club.getOneMember(args.cuid, args.uuid);
		
		// set member properties
		case "setmember":
			var args = util.checkArg(query, { cuid: "int", uuid: "int", title: "string", is_admin: "bool" });
			
			await club.setMember(args.cuid, usr.getUUID(), args);
		
			return;
			
		case "invite":
			var args = util.checkArg(query, { cuid: "int", uuids: "array" });
			
			await club.sendInvitation(args.cuid, usr.getUUID(), args.uuids);
			
			return;
		
		case "delmember":
			var args = util.checkArg(query, { cuid: "int", uuid: "int" });
			
			await club.removeMember(args.cuid, usr.getUUID(), args.uuid);
			
			return;
			
		case "memberinfo":
			var args = util.checkArg(query, { cuid: "int" });
			
			await club.checkMemberExist(args.cuid, usr.getUUID(), true);
			
			return (await club.cuid(args.cuid)).getRelatedInfo(usr.getUUID());
		
		case "setinfo":
			var args = util.checkArg(query, { cuid: "int" });
			var info = util.checkArg(query, club.Club.format.info, true);
			
			await club.setInfo(args.cuid, usr.getUUID(), info);
			
			return;
			
		case "transcreator":
			var args = util.checkArg(query, { cuid: "int", uuid: "int" });
	
			await club.transferCreator(args.cuid, usr.getUUID(), args.uuid);
	
			return;
			
		// get info of club under review(by the creator himself)
		case "reviewinfo":
			var args = util.checkArg(query, { cuid: "int" });
			return await club.getReviewInfo(args.cuid, usr.getUUID());
	
		default:
			throw new err.Exc("$core.action_not_exist");
	}
};

encop.forumi = async (env, usr, query, next) => {
	switch (query.action) {
		case "getpost":
			var args = util.checkArg(query, {
				cuid: "int",
				kw: { opt: true, type: "string" },
				skip: { opt: true, type: "int" },
				limit: { opt: true, type: "int" }
			});
			
			return await forumi.searchPost(args.cuid, usr.getUUID(), {
				kw: args.kw || "",
				skip: args.skip,
				limit: args.limit
			});

		case "getonepost":
			var args = util.checkArg(query, { cuid: "int", puid: "int" });
			return await forumi.getOnePost(args.cuid, args.puid, usr.getUUID());

		case "getcomment":
			var args = util.checkArg(query, {
				cuid: "int",
				puid: "int",
				skip: { opt: true, type: "int" },
				limit: { opt: true, type: "int" }
			});
			
			return await forumi.getPostComment(args.cuid, args.puid, usr.getUUID(),
											   { skip: args.skip, limit: args.limit });
		
		case "newpost":
			var args = util.checkArg(query, { cuid: "int" });
			var conf = util.checkArg(query, forumi.PostObject.format.newpost, true);
		
			var post = await forumi.newPost(args.cuid, usr.getUUID(), conf);
		
			return post.getPreview();
		
		case "newcomment":
			var args = util.checkArg(query, { cuid: "int", puid: "int" });
			var conf = util.checkArg(query, forumi.PostComment.format.comment, true);
			
			return await forumi.newComment(args.cuid, args.puid, usr.getUUID(), conf);
		
		case "editcomment":
			var args = util.checkArg(query, { cuid: "int", puid: "int", comment: "int" });
			var conf = util.checkArg(query, forumi.PostComment.format.comment, true);
		
			await forumi.editComment(args.cuid, args.puid, args.comment, usr.getUUID(), conf);
			
			return;
		
		case "editpost":
			var args = util.checkArg(query, { cuid: "int", puid: "int" });
			var conf = util.checkArg(query, forumi.PostObject.format.newpost, true);
		
			await forumi.editPost(args.cuid, args.puid, usr.getUUID(), conf);
			
			return;
		
		case "pinpost":
			var args = util.checkArg(query, { cuid: "int", puid: "int", pinned: "int" });
			
			await forumi.pinPost(args.cuid, args.puid, usr.getUUID(), args.pinned);
			
			return;
		
		default:
			throw new err.Exc("$core.action_not_exist");
	}
};

encop.cutil = async (env, usr, query, next) => {
	switch (query.action) {
		case "new":
			var conf = util.checkArg(query, cutil.CUtil.format.info, true);

			await user.checkRoot(usr.getUUID());
			var utl = await cutil.newUtil(conf);

			return utl;

		case "setinfo":
			var args = util.checkArg(query, { cuuid: "int" });
			var conf = util.checkArg(query, cutil.CUtil.format.info, true);

			await cutil.setInfo(args.cuuid, usr.getUUID(), conf);

			return;

		case "submit":
			var args = util.checkArg(query, { cuuid: "int", form: "json" });
			await cutil.submit(args.cuuid, usr.getUUID(), args.form);
			return;

		case "enable":
			var args = util.checkArg(query, { cuuid: "int", enable: "bool" });

			await user.checkRoot(usr.getUUID());
			await cutil.enable(args.cuuid, args.enable);

			return;

		default:
			throw new err.Exc("$core.action_not_exist");
	}
};
