"use strict";

var express = require("express");

var db = require("./core/db");
var err = require("./core/err");
var auth = require("./core/auth");
var user = require("./core/user");
var util = require("./core/util");
var file = require("./core/file");
var config = require("./core/config");

var int = require("./core/int");

var app = express();

/*

app.get("/test", util.route(async env => {
	var res = await user.checkPass("rodlin", "123456");
	// await user.insertNewUser("Rod", "rodlin", "123456");
	env.qjson({ suc: true });
}));

*/

/* official api */
app.get("/auth", int.auth);
app.get("/favtag", int.favtag);
app.get("/dict", int.dict);

app.get("/user/new", int.user.new);
app.get("/user/login", int.user.login);
app.get("/user/csid", int.user.csid);
app.get("/user/info", int.user.info);
app.get("/user/org", int.user.org);
app.get("/user/partic", int.user.partic);
app.get("/user/encop", int.user.encop);

app.get("/event/info", int.event.info);
app.get("/event/search", int.event.search);

app.post("/file/upload", int.file.upload);
app.get("/file/download", int.file.download);
/* official api */

app.get("/test", util.route(async env => {}));

app.get("/test/enc", util.route(async env => {
	var args = util.checkArg(env.query, { "dat": "string" });
	env.qsuc(auth.rsa.enc(args.dat));
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

app.use("/", express.static("front"));
app.use("/semantic", express.static("semantic/dist"));

var server = app.listen(config.port, function () {
	var host = server.address().address;
	var port = server.address().port;

	util.log("listening at " + host + ":" + port);
});
