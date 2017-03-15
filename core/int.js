// interfaces

"use strict";

var db = require("./db");
var err = require("./err");
var auth = require("./auth");
var user = require("./user");
var util = require("./util");
var config = require("./config");

var Env = require("./env").Env;

exports.auth = util.route(async env => {
	env.qsuc(auth.rsa.getAuthKey());
});

var _user = {};

_user.new = util.route(async env => {
	var args = util.checkArg(env.query, {
		"dname": "string",
		"lname": "string",
		"pkey": "string",
		"penc": "string"
	});

	var passwd = auth.rsa.dec(args.penc, args.pkey);
	var res = await user.insertNewUser(args.dname, args.lname, passwd);

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

	var sid = await user.login(args.lname, sep[1]);

	var res = auth.aes.enc(sid, tmpkey);

	// console.log(res);

	env.qsuc(res);
});

/*
	{
		int: interface name,
		<other args>
	}
 */
_user.encop = util.route(async env => {
	var args = util.checkArg(env.query, { "lname": "string", "enc": "string" });
	var sid = await user.getSession(args.lname);

	if (!sid)
		throw new err.Exc("invalid session id");

	var uuid = await user.checkSession(sid);

	var query = auth.aes.dec(args.enc, sid);

	if (!query)
		throw new err.Exc("invalid session id");

	query = JSON.parse(query);

	if (!query.int)
		throw new err.Exc("wrong format");

	if (!encop.hasOwnProperty(query.int))
		throw new err.Exc("no such interface");

	var proc = encop[query.int];

	return await proc(env, uuid, query);
});

exports.user = _user;

/* encrypted operations */

var encop = {};

encop.info = async (env, uuid, query) => {
	switch (query.action) {
		case "get":
			env.qsuc(await user.getInfo(uuid));
			break;

		case "set":
			var setq = {};

			for (var k in user.User.infokey) {
				if (user.User.infokey.hasOwnProperty(k) &&
					query.hasOwnProperty(k))
					setq[k] = query[k];
			}

			// format and check limit
			setq = util.checkArg(setq, user.User.infokey, true);

			await user.setInfo(uuid, setq);

			env.qsuc();

			break;

		default:
			throw new err.Exc("no such action");
	}
};
