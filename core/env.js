"use strict";

var err = require("./err");
var util = require("./util");
var config = require("./config");

var multiparty = require("multiparty");

var Env = function (req, res) {
	var qjson = obj => {
		res.set("Content-Type", "application/json");
		res.send(JSON.stringify(obj));
	};

	this.header = obj => {
		for (var k in obj) {
			if (obj.hasOwnProperty(k)) {
				res.set(k, obj[k]);
			}
		}
	};

	this.setCT = ct => res.set("Content-Type", ct);

	this.raw = dat => res.send(dat);

	this.qjson = qjson;
	this.qsuc = obj => qjson({ suc: true, res: obj });
	this.qerr = msg => {
		if (is_static) {
			res.status(500);
		}

		qjson({ suc: false, msg: msg });
	};

	// static file mode(convert errors to http status)
	var is_static = false;
	this.setStatic = val => is_static = val === undefined ? true : val;
	
	this.ip = () => {
		if (req.get("X-Forwarded-For")) {
			return req.get("X-Forwarded-For").split(",")[0].trim();
		} else
		 	return req.get("X-Real-IP") || req.ip;
	};
	
	this.qcap = (challenge) => qjson({ suc: false, cap: true, dat: challenge });
	
	this.redir = url => res.redirect(url);

	this.query = util.extend(req.query, req.body);
	this.file = {};
	
	this.pipe = stream => {
		// req.pipe(stream);
		return stream.pipe(res);
	};
	
	this.setTimeout = time => {
		req.connection.setTimeout(time);
	};

	this.setExpire = (time, modified) => { // time in sec
		if (modified) {
			res.set("Last-Modified", modified.toUTCString());
		}

		res.set("Expires", (new Date(new Date() + time * 1000)).toUTCString());
		res.set("Cache-Control", "max-age=" + time);
	};

	if (req.method == "POST") {
		this.init = cb => {
			if (req.headers["content-type"].indexOf("form-urlencoded") != -1) {
				cb();
			} else {
				var form = new multiparty.Form({ maxFilesSize: config.file.max_size });

				form.parse(req, (e, query, file) => {
					if (e) {
						this.qerr("$core.fail_upload");
						util.log(e, util.style.yellow("EXCEPTION"));
						return;
					}

					for (var k in query) {
						if (query.hasOwnProperty(k)) {
							this.query[k] = query[k][0];
						}
					}

					for (var k in file) {
						if (file.hasOwnProperty(k)) {
							this.file[k] = file[k][0];
						}
					}

					return cb();
				});
			}
		};
	} else this.init = cb => cb()
};

exports.Env = Env;
