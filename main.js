"use strict";

var express = require("express");

var db = require("./core/db");
var auth = require("./core/auth");
var user = require("./core/user");
var util = require("./core/util");
var config = require("./core/config");

var Env = require("./core/env").Env;

var app = express();

app.get("/test", util.route(async env => {
	var res = await user.checkPass("rodlin", "123456");
	// await user.insertNewUser("Rod", "rodlin", "123456");
	env.qjson({ suc: true });
}));

app.get("/test/enc", util.route(async env => {
	var args = util.checkArg(env.query, { "dat": "string" });
	env.qsuc(auth.encrypt(args.dat));
}));

app.get("/auth", util.route(async env => {
	env.qsuc(auth.getAuthKey());
}));

app.get("/user/new", util.route(async env => {
	var args = util.checkArg(env.query, {
		"dname": "string",
		"lname": "string",
		"pkey": "string",
		"penc": "string"
	});

	var passwd = auth.decrypt(args.penc, args.pkey);
	var res = await user.insertNewUser(args.dname, args.lname, passwd);

	env.qsuc();
}));

app.get("/user/login", util.route(async env => {
	var args = util.checkArg(env.query, {
		"lname": "string",
		"pkey": "string",
		"penc": "string"
	});

	var passwd = auth.decrypt(args.penc, args.pkey);
	var sid = await user.login(args.lname, passwd);

	env.qsuc(sid);
}));

// check sid
app.get("/user/csid", util.route(async env => {
	var args = util.checkArg(env.query, { "sid": "string" });
	await user.checkSession(args.sid);
	env.qsuc();
}));

var server = app.listen(config.port, function () {
	var host = server.address().address;
	var port = server.address().port;

	util.log("listening at " + host + ":" + port);
});
