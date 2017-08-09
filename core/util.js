"use strict";

var crypto = require("crypto");
var NodeRSA = require("node-rsa");
var Env = require("./env").Env;
var err = require("./err");
var util = require("./util");

var readline = require("readline");

Object.prototype.extend = function (obj) {
	for (var k in obj) {
		if (obj.hasOwnProperty(k)) {
			this[k] = obj[k];
		}
	}

	return this;
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

	env.init(async () => {
		try {
			return await handler(env);
		} catch (e) {
			if (e instanceof err.Exc) {
				env.qerr(e.toString());
				util.log(e, exports.style.yellow("EXCEPTION"));
				if (e.exc) {
					util.log(e.exc.stack, exports.style.yellow("ERROR"));
				} else {
					util.log(e.stack, exports.style.blue("STACK"));
				}
			} else {
				env.qerr("$core.internal_err");
				util.log(e.stack, exports.style.red("ERROR"));
			}
		}
	});
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

exports.checkArg = checkArg;

exports.stamp = type => (new Date()).getTime() / (type == "unix" ? 1000 : 1);

var ask_rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

exports.ask = (ques, cb) => {
	ask_rl.question(ques, cb);
};
