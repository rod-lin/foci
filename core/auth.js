"use strict";

var NodeRSA = require("node-rsa");

var err = require("./err");
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

	return key.decrypt(enc);
};

exports.encrypt = (msg, encoding) => {
	var pub = exports.getAuthKey();
	var key = cached[pub];

	encoding = encoding || encodeURIComponent;

	return {
		key: encoding(pub),
		enc: encoding(key.encrypt(msg, "base64"))
	};
};
