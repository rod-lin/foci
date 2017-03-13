"use strict";

var NodeRSA = require("node-rsa");

var err = require("./err");
var util = require("./util");
var config = require("./config");

// len in bits
var genKey = len => new NodeRSA({ b: len || config.auth.rsalen });

NodeRSA.prototype.pub = function () {
	return this.exportKey("pkcs1-public-der").toString("base64");
};

NodeRSA.prototype.priv = function () {
	return this.exportKey("pkcs1-private-der").toString("base64");
};

var cached = {};
var keys = [];

for (var i = 0; i < config.auth.cache; i++) {
	var key = genKey();
	// console.log(key.pub());
	var pub = key.pub();

	keys.push(pub);
	cached[pub] = key;
}

/*
	
	var NodeRSA = require("node-rsa");

	var key = new NodeRSA({ b: 512 });

	console.log(key.exportKey("pkcs1-private-pem"));
	console.log(key.exportKey("pkcs1-public-der").length);

	var enc = key.encrypt("hello", "base64");
	console.log(enc);
	console.log(key.decrypt(enc, "binary"));

 */

exports.getAuthKey = i => keys[i === undefined ? Math.trunc(Math.random() * config.auth.cache) : i];

exports.decrypt = (enc, pub) => {
	var key = cached[pub];

	if (!key)
		throw new err.Exc("key does not exist");

	var dat = key.decrypt(enc, "binary");

	console.log(dat);

	var sep = dat.split("|", 2);
	var time = parseInt(sep[0]);
	var now = util.stamp();

	if (isNaN(time) || sep.length < 2)
		throw new err.Exc("wrong header");

	if (now - time > config.auth.head_timeout)
		throw new err.Exc("header timeout");

	return sep[1];
};

exports.encrypt = (msg, encoding) => {
	var pub = exports.getAuthKey();
	var key = cached[pub];

	encoding = encoding || encodeURIComponent;

	return {
		key: encoding(pub),
		enc: encoding(key.encrypt(util.stamp() + "|" + msg, "base64"))
	};
};
