"use strict";

var express = require("express");

var db = require("./core/db");
var user = require("./core/user");
var util = require("./core/util");
var config = require("./core/config");

var Env = require("./core/env").Env;

var app = express();

app.get("/test", util.route(async env => {
	var res = await user.insertNewUser("Rod", "rodlin", util.md5("123456"));
	env.qjson({ suc: true });
}));

var server = app.listen(config.port, function () {
	var host = server.address().address;
	var port = server.address().port;

	util.log("listening at " + host + ":" + port);
});
