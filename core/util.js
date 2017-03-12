"use strict";

var crypto = require("crypto");
var NodeRSA = require("node-rsa");
var Env = require("./env").Env;

exports.style = require("cli-color");

exports.log = (msg, dir) => {
	console.log("%s: %s%s", new Date(), dir ? dir + ": " : "", msg);
}

exports.route = (handler) => (req, res) => handler(new Env(req, res));

exports.md5 = (cont, format) => {
	var sum = crypto.createHash("md5");
	sum.update(cont);
	return sum.digest(format);
};

crypto.privateDecrypt;
crypto.publicEncrypt;
