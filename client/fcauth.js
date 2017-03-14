"use strict";

window.FCAuth = {};

(function () {
	var NodeRSA = require("node-rsa");
	var CryptoJS = require("crypto-js");
	var $ = require("jquery");

	var getSync = function (url, data) {
		return JSON.parse($.ajax({
			type: "GET",
			async: false,
			url: url,
			data: data
		}).responseText);
	};

	FCAuth.salt = function () {
		var tmp = Math.random().toString();
		return CryptoJS.AES.encrypt(tmp, tmp).toString();
	};

	FCAuth.rsaenc = function (msg, pub) {
		var key = new NodeRSA();
		key.importKey(new Buffer(pub, "base64"), "pkcs1-public-der");
		return key.encrypt(msg, "base64");
	};

	FCAuth.aesenc = function (msg, key) {
		return CryptoJS.AES.encrypt(msg, key).toString();
	};

	FCAuth.aesdec = function (enc, key) {
		var res = CryptoJS.AES.decrypt(enc, key).toString(CryptoJS.enc.Utf8);
		if (res === "") res = null;
		return res;
	};

	FCAuth.getAuth = function () {
		var val = getSync("/auth");
		return val.res;
	};
})();
