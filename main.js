"use strict";

var express = require("express");

var db = require("./core/db");
var err = require("./core/err");
var auth = require("./core/auth");
var user = require("./core/user");
var util = require("./core/util");
var config = require("./core/config");

var Env = require("./core/env").Env;

var app = express();

/*

app.get("/test", util.route(async env => {
	var res = await user.checkPass("rodlin", "123456");
	// await user.insertNewUser("Rod", "rodlin", "123456");
	env.qjson({ suc: true });
}));

*/

app.get("/test/enc", util.route(async env => {
	var args = util.checkArg(env.query, { "dat": "string" });
	env.qsuc(auth.rsa.enc(args.dat));
}));

app.get("/auth", util.route(async env => {
	env.qsuc(auth.rsa.getAuthKey());
}));

app.get("/user/new", util.route(async env => {
	var args = util.checkArg(env.query, {
		"dname": "string",
		"lname": "string",
		"pkey": "string",
		"penc": "string"
	});

	var passwd = auth.rsa.dec(args.penc, args.pkey);
	var res = await user.insertNewUser(args.dname, args.lname, passwd);

	env.qsuc();
}));

app.get("/user/login", util.route(async env => {
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

	console.log(res);

	env.qsuc(res);
}));

// check sid
app.get("/user/test/csid", util.route(async env => {
	var args = util.checkArg(env.query, { "sid": "string" });
	await user.checkSession(args.sid);
	env.qsuc();
}));

app.get("/user/test/echo", util.route(async env => {
	var args = util.checkArg(env.query, { "lname": "string", "enc": "string" });
	var sid = await user.getSession(args.lname);

	if (!sid)
		throw new err.Exc("invalid session id");

	await user.checkSession(sid);

	var query = auth.aes.dec(args.enc, sid);

	if (!query)
		throw new err.Exc("invalid session id");

	env.qsuc(query);
}));

app.use("/test", express.static("test"));

var server = app.listen(config.port, function () {
	var host = server.address().address;
	var port = server.address().port;

	util.log("listening at " + host + ":" + port);
});
