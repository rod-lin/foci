"use strict";

window.JQuery = window.$ = require("jquery");
window.FCAuth = {};

(function () {
	var NodeRSA = require("node-rsa");
	var CryptoJS = require("crypto-js");

	var server = "";

	var Session = function (lname, uuid, sid) {
		if (uuid === undefined) {
			$.extend(this, lname);
			return;
		}

		this.lname = lname;
		this.uuid = uuid;
		this.sid = sid;
	};

	Session.prototype = {};
	Session.prototype.getUUID = function () { return this.uuid; };
	Session.prototype.getSID = function () { return this.sid; };

	var getSync = function (url, data) {
		var res = $.ajax({
			type: "GET",
			async: false,
			url: url,
			dataType: "json",
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
			dataType: "json",
			data: data,
			success: function (dat) {
				return cb(true, dat);
			},

			error: function (req, err, exc) {
				return cb(false, err);
			}
		});
	};

	FCAuth.sget = getSync;
	FCAuth.get = function (url, data, cb) {
		getAsync(url, data, function (suc, dat) {
			if (!suc) return cb(false, "network error");
			if (!dat.suc) return cb(false, dat.msg);
			return cb(true, dat.res);
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

	FCAuth.setLocal = function (key, value) {
		return localStorage[key] = JSON.stringify(value);
	};

	FCAuth.getLocal = function (key) {
		var val = localStorage[key];
		if (!val) return undefined;
		return JSON.parse(val);
	};

	FCAuth.removeLocal = function (key) {
		localStorage.removeItem(key);
	};

	FCAuth.newUser = function (lname, passwd, cb) {
		getAsync(server + "/auth", {}, function (suc, dat) {
			if (!suc) return cb(false, "network error");
			if (!dat.suc) return cb(false, dat.msg);

			var pub = dat.res;

			getAsync(server + "/user/new", {
				lname: lname,
				pkey: pub,
				penc: FCAuth.rsaenc(passwd, pub)
			}, function (suc, dat) {
				if (!suc) return cb(false, "network error");
				if (!dat.suc) return cb(false, dat.msg);
				return cb(true, dat.res);
			});
		});
	};

	// cb(suc, dat/err)
	FCAuth.login = function (lname, passwd, cb) {
		var salt = FCAuth.salt();

		getAsync(server + "/auth", {}, function (suc, dat) {
			if (!suc) return cb(false, "network error");
			if (!dat.suc) return cb(false, dat.msg);

			var pub = dat.res;

			getAsync(server + "/user/login", {
				lname: lname,
				pkey: pub,
				penc: FCAuth.rsaenc(salt + ":" + passwd, pub)
			}, function (suc, dat) {
				if (!suc) return cb(false, "network error");
				if (!dat.suc) return cb(false, dat.msg);

				var sid = FCAuth.aesdec(dat.res.sid, salt);
				if (!sid) return cb(false, "server error");

				var ses = new Session(lname, dat.res.uuid, sid);

				FCAuth.setLocal("session", ses);
				return cb(true, ses);
			});
		});
	};

	// quick login
	// cb(Session)
	FCAuth.qlogin = function (cb) {
		var session = FCAuth.getLocal("session");
		var clear = function () {
			FCAuth.removeLocal("session");
		};

		if (!session) {
			clear();
			return cb(false, "no session stored");
		}

		session = new Session(session);

		getAsync(server + "/user/csid", {
			uuid: session.getUUID(),
			enc: FCAuth.aesenc("hello", session.getSID())
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
		var uuid = session.getUUID();
		var sid = session.getSID();

		getAsync(server + "/user/encop", {
			uuid: uuid,
			enc: FCAuth.aesenc(JSON.stringify(query), sid)
		}, function (suc, dat) {
			if (!suc) return cb(false, "network error");
			if (!dat.suc) return cb(false, dat.msg);
			return cb(true, JSON.parse(FCAuth.aesdec(dat.res, sid)));
		});
	};
})();
