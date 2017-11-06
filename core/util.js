"use strict";

var Env = require("./env").Env;
var err = require("./err");
var config = require("./config");
var watchdog = require("./watchdog");

var url = require("url");
var crypto = require("crypto");
var NodeRSA = require("node-rsa");
var readline = require("readline-sync");

Object.prototype.extend = function (obj) {
	for (var k in obj) {
		if (obj.hasOwnProperty(k)) {
			this[k] = obj[k];
		}
	}

	return this;
};

String.prototype.replaceAll = function (val, rep) {
	var str = this;

	var next = 0;
	var i = str.indexOf(val);
	var replen = rep.length;
	var vallen = val.length;

	var ret = "";

	while (i != -1) {
		next += i + vallen;
		ret += str.substring(next, next + i) + rep;
		i = str.substring(next).indexOf(val);
		// console.log(i, next, str.substring(next));
	}

	ret += str.substring(next);

	return ret;
};

Object.prototype.fieldCount = function () {
	return Object.keys(this).length;
};

exports.salt = (len) => {
	var static_buf = new Buffer(len || 16);
	var tab = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

	for (var i = 0; i < static_buf.length; i++) {
		static_buf[i] = tab[Math.trunc(Math.random() * tab.length)].charCodeAt(0);
	}

	return static_buf.toString();
};

exports.style = require("cli-color");

exports.log = (msg, dir) => {
	console.log("%s: %s%s", new Date(), dir ? dir + ": " : "", msg);
};

exports.route = (handler) => async (req, res) => {
	// console.log("hi: " + req);
	// console.log(res);

	var env = new Env(req, res);

	// setTimeout(function () {
	
	env.init(async () => {
		try {
			watchdog.logRequest(env.ip(), url.parse(req.url).pathname);
			return await handler(env);
		} catch (e) {
			if (e instanceof err.Exc) {
				env.qerr(e.toString());
				exports.log(e, exports.style.yellow("EXCEPTION"));
				if (e.exc) {
					exports.log(e.exc.stack, exports.style.yellow("ERROR"));
				} else {
					exports.log(e.stack, exports.style.blue("STACK"));
				}
			} else {
				env.qerr("$core.internal_err");
				exports.log(e.stack, exports.style.red("ERROR"));
			}
		}
	});
	
	// }, 1000);
};

exports.md5 = (cont, format) => {
	var sum = crypto.createHash("md5");
	sum.update(cont);
	return sum.digest(format);
};

exports.sha1 = (cont, format) => {
	var sum = crypto.createHash("sha1");
	sum.update(cont);
	return sum.digest(format);
};

var checkArg = (args, req, opt) => {
	var ret = {};
	
	// check default arg captcha answer
	if (!req["capans"]) {
		req["capans"] = { type: "json", opt: true };
	}

	for (var k in req) {
		if (k[0] == "$") continue;

		if (!req.hasOwnProperty(k))
			continue;

		if (!args.hasOwnProperty(k)) {
			if (opt || (req[k] && req[k].opt)) continue;
			throw new err.Exc("$core.expect_argument(" + k + ")");
		}

		var entry = req[k];
		var tmp = args[k];
		var clim = null;

		// if (typeof entry === "string") {

		if (typeof entry === "object") {
			clim = entry.lim;
			entry = entry.type;
		}

		switch (entry) {
			case "string":
				if (typeof tmp !== "string")
					throw new err.Exc("$core.expect_argument_type(" + k + ",string)");

				break;

			case "int":
				if (typeof tmp === "number")
					break;

				tmp = parseInt(tmp);
				if (isNaN(tmp))
					throw new err.Exc("$core.expect_argument_type(" + k + ",int)");

				break;

			case "number":
				if (typeof tmp === "number")
					break;

				tmp = parseFloat(tmp);
				if (isNaN(tmp))
					throw new err.Exc("$core.expect_argument_type(" + k + ",number)");

				break;

			case "bool":
				if (typeof tmp === "boolean")
					break;

				if (tmp == "true")
					tmp = true;
				else if (tmp == "false")
					tmp = false;
				else
					throw new err.Exc("$core.expect_argument_type(" + k + ",bool)");

				break;

			case "array":
				if (typeof tmp !== "string") {
					if (!(tmp instanceof Array))
						throw new err.Exc("$core.expect_argument_type(" + k + ",array)");

					break;
				}

				try {
					// console.log(tmp);
					tmp = JSON.parse(tmp);
				} catch (e) {
					throw new err.Exc("$core.wrong_json_format", e);
				}

				if (!(tmp instanceof Array))
					throw new err.Exc("$core.expect_argument_type(" + k + ",array)");

				break;

			case "object":
			case "json":
				if (typeof tmp !== "string")
					break;

				try {
					// console.log(tmp);
					tmp = JSON.parse(tmp);
				} catch (e) {
					throw new err.Exc("$core.wrong_json_format", e);
				}

				break;
		}

		if (clim)
			tmp = clim(tmp);

		// } /* else if (typeof entry === "object") {
			// tmp = checkArg(tmp, entry);
		// } */

		ret[k] = tmp;
	}

	if (req.$overall) {
		req.$overall(ret);
	}

	return ret;
};

// length limit
checkArg.lenlim = (len, sth) => {
	return {
		type: "string",
		lim: val => {
			if (val.length > len)
				throw new err.Exc(sth || "$core.too_long($core.word.string)");
			return val;
		}
	};
};

// positive number
checkArg.posint = (max, sth) => {
	return {
		type: "int",
		lim: val => {
			if (val < 0 || (max && val > max))
				throw new err.Exc(sth || "$core.out_of_range(integer)");
			return val;
		}
	};
};

checkArg.nested = (conf, opt) => {
	return {
		type: "json",
		lim: val => {
			return checkArg(val, conf, opt);
		}
	}
};

checkArg.inarr = (arr, type) => {
	return {
		type: type || "json",
		lim: val => {
			if (arr.indexOf(val) == -1) {
				throw new err.Exc("$core.wrong_argument");
			}
			
			return val;
		}
	}
};

exports.checkArg = checkArg;

exports.stamp = type => (new Date()).getTime() / (type == "unix" ? 1000 : 1);

exports.ask = (ques, cb) => {
	return readline.question(ques).trim();
};

exports.getPass = () => {
	if (config.pass) return config.pass;
	else return config.pass = exports.ask("password: ");
};

exports.regEscape = str => str.replace(/[\^\$\(\)\[\]\{\}*+\.\?\\\|]/g, "\\$1");

exports.keywordRegExp = kw => new RegExp(exports.regEscape(kw.trim()).split(/\s+/).join("|"), "i");

exports.coin = prob => Math.random() > prob;
