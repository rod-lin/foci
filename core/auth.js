"use strict";

var NodeRSA = require("node-rsa");
var CryptoJS = require("crypto-js");

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

exports.rsa = {
	getAuthKey: i => keys[i === undefined ? Math.trunc(Math.random() * config.auth.cache) : i],

	enc: (msg, encoding) => {
		var pub = exports.getAuthKey();
		var key = cached[pub];

		encoding = encoding || encodeURIComponent;

		return {
			key: encoding(pub),
			enc: encoding(key.encrypt(msg, "base64"))
		};
	},

	dec: (enc, pub) => {
		var key = cached[pub];

		if (!key)
			throw new err.Exc("$not_exist($key)");

		var dat = key.decrypt(enc, "binary");

		// console.log(dat);

		return dat;
	}
};

exports.aes = {
	enc: (msg, key) => CryptoJS.AES.encrypt(msg, key).toString(),
	dec: (enc, key) => {
		var res = "";		

		try {
			var res = CryptoJS.AES.decrypt(enc, key).toString(CryptoJS.enc.Utf8);
		} catch (e) {}

		if (res === "") return null; // throw new err.Exc("wrong aes key");
		
		return res;
	}
};
