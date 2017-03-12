"use strict";

var crypto = require("crypto");
var NodeRSA = require("node-rsa");
var Env = require("./env").Env;
var err = require("./err");
var util = require("./util");

Object.prototype.extend = function (obj) {
	for (var k in obj) {
		if (obj.hasOwnProperty(k)) {
			this[k] = obj[k];
		}
	}

	return this;
};

exports.style = require("cli-color");

exports.log = (msg, dir) => {
	console.log("%s: %s%s", new Date(), dir ? dir + ": " : "", msg);
}

exports.route = (handler) => async (req, res) => {
	var env = new Env(req, res);	

	try {
		return await handler(env);
	} catch (e) {
		if (e instanceof err.Exc) {
			env.qerr(e.toString());
			util.log(e, exports.style.yellow("EXCEPTION"));
		} else {
			env.qerr("internal error");
			util.log(e.stack, exports.style.red("ERROR"));
		}
	}
};

exports.md5 = (cont, format) => {
	var sum = crypto.createHash("md5");
	sum.update(cont);
	return sum.digest(format);
};
