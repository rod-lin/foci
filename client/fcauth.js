"use strict";

window.JQuery = window.$ = require("jquery");
window.FCAuth = {};

(function () {
	var NodeRSA = require("node-rsa");
	var CryptoJS = require("crypto-js");

	var getSync = function (url, data) {
		var res = $.ajax({
			type: "GET",
			async: false,
			url: url,
			data: data
		}).responseText;

		if (!res) return null;

		return JSON.parse(res);
	};

	// cb(suc, data)
	var getAsync = function (url, data, cb) {
		$.ajax({
			type: "GET",
			url: url,
			data: data,
			success: function (dat) {
				return cb(true, dat);
			},

			error: function (req, err, exc) {
				return cb(false, err);
			}
		});
	};

	FCAuth.salt = function (len) {
		var static_buf = new Array(len || 16);
		var tab = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		for (var i = 0; i < static_buf.length; i++) {
			static_buf[i] = tab[Math.trunc(Math.random() * tab.length)];
		}

		return static_buf.join("");
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
		return val ? val.res : null;
	};

	FCAuth.setLocal = function (key, value) {
		return localStorage[key] = JSON.stringify(value);
	};

	FCAuth.getLocal = function (key) {
		return JSON.parse(localStorage[key]);
	};

	FCAuth.removeLocal = function (key) {
		localStorage.removeItem(key);
	};

	// cb(suc, dat/err)
	FCAuth.login = function (lname, passwd, cb) {
		var pub = FCAuth.getAuth();
		var salt = FCAuth.salt();

		if (!pub) return cb(false, "network error");

		getAsync("/user/login", {
			lname: lname,
			pkey: pub,
			penc: FCAuth.rsaenc(salt + ":" + passwd, pub)
		}, function (suc, dat) {
			if (!suc) return cb(false, "network error");
			if (!dat.suc) return cb(false, dat.msg);

			var sid = FCAuth.aesdec(dat.res, salt);
			if (!sid) return cb(false, "server error");

			FCAuth.setLocal("session", [ lname, sid ]);
			return cb(true, [ lname, sid ]);
		});
	};

	// quick login
	// cb([ lname, sid ])
	FCAuth.qlogin = function (cb) {
		var session = FCAuth.getLocal("session");
		var clear = function () {
			FCAuth.removeLocal("session");
		};

		if (!session) {
			clear();
			return cb(false, "no session stored");
		}

		getAsync("/user/csid", {
			lname: session[0],
			enc: FCAuth.aesenc("hello", session[1])
		}, function (suc, dat) {
			if (!suc) {
				clear();
				return cb(false, "network error");
			}

			if (!dat.suc) {
				clear();
				return cb(false, "invalid session id");
			}

			return cb(true, session);
		});
	};

	FCAuth.encop = function (session, query, cb) {
		var lname = session[0];
		var sid = session[1];

		getAsync("/user/encop", {
			lname: lname,
			enc: FCAuth.aesenc(JSON.stringify(query), sid)
		}, function (suc, dat) {
			if (!suc) return cb(false, "network error");
			if (!dat.suc) return cb(false, dat.msg);
			return cb(true, dat.res);
		});
	};
})();
