"use strict";

var NodeRSA = require("node-rsa");

var config = require("./config");

// len in bits
var genKey = len => new NodeRSA({ b: len || config.auth.rsalen });

var cached = [];

for (var i = 0; i < config.auth.cache; i++) {
	cached.push(genKey());
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
