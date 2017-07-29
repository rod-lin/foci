"use strict";

var fs = require("fs");
var http = require("http");
var https = require("https");
var express = require("express");

var db = require("./core/db");
var err = require("./core/err");
var auth = require("./core/auth");
var user = require("./core/user");
var util = require("./core/util");
var file = require("./core/file");
var config = require("./core/config");
var notice = require("./core/notice");

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

// app.get("/alipay/test", int.alipay.test);

app.get("/smsg/vercode", int.smsg.vercode);
// app.get("/smsg/verify", int.smsg.verify);

app.get("/mail/vercode", int.mail.vercode);

app.get("/user/new", int.user.new);
app.get("/user/login", int.user.login);
app.get("/user/csid", int.user.csid);
app.get("/user/info", int.user.info);
app.get("/user/org", int.user.org);
app.get("/user/applied", int.user.applied);
app.get("/user/encop", int.user.encop);
app.get("/user/search", int.user.search);

app.get("/event/info", int.event.info);
app.get("/event/search", int.event.search);
app.get("/event/comment", int.event.comment);

app.post("/file/upload", int.file.upload);
app.get("/file/download", int.file.download);
/* official api */

app.get("/test", util.route(async env => {
	await notice.push(23, 55, { msg: "Deadpool is coming!", type: "event" });
}));

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

app.use("/main", express.static("front/main.html"));

app.get("/", function (req, res) { res.redirect("/main"); });

var serv = http.createServer(app);
serv.listen(config.port, function () {
	var host = serv.address().address;
	var port = serv.address().port;

	util.log("listening at http://" + host + ":" + port);
});

/* https */

if (config.ssl.enabled) {
	try {
		var priv = fs.readFileSync(config.ssl.privkey, "UTF-8");
		var cert = fs.readFileSync(config.ssl.certif, "UTF-8");

		var cred = { key: priv, cert: cert };
		var sslserv = https.createServer(cred, app);

		sslserv.listen(config.ssl.port, function () {
			var host = sslserv.address().address;
			var port = sslserv.address().port;

			util.log("listening at https://" + host + ":" + port);
		});
	} catch (e) {
		util.log("failed to enable https: " + e.toString(), util.style.yellow("ERROR"));
	}
}
