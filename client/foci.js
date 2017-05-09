"use strict";

window.jQuery = window.$ = require("jquery");
window.foci = {};

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

	var sendSync = function (url, data, method, ext) {
		var res = $.ajax($.extend({
			type: method || "GET",
			async: false,
			url: url,
			dataType: "json",
			data: data
		}, ext || {})).responseText;

		if (!res) return null;

		return JSON.parse(res);
	};

	// cb(suc, data)
	var sendAsync = function (url, data, cb, method, ext) {
		$.ajax($.extend({
			type: method || "GET",
			url: url,
			dataType: "json",
			data: data,
			success: function (dat) {
				return cb(true, dat);
			},

			error: function (req, err, exc) {
				return cb(false, err);
			}
		}, ext || {}));
	};

	foci.sget = sendSync;
	foci.get = function (url, data, cb) {
		sendAsync(url, data, function (suc, dat) {
			if (!suc) return cb(false, "$network_error");
			if (!dat.suc) return cb(false, dat.msg);
			return cb(true, dat.res);
		});
	};

	foci.post = function (url, data, cb) {
		sendAsync(url, data, function (suc, dat) {
			if (!suc) return cb(false, "$network_error");
			if (!dat.suc) return cb(false, dat.msg);
			return cb(true, dat.res);
		}, "POST", { cache: false, contentType: false, processData: false });
	};

	foci.salt = function (len) {
		var static_buf = new Array(len || 16);
		var tab = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		for (var i = 0; i < static_buf.length; i++) {
			static_buf[i] = tab[Math.trunc(Math.random() * tab.length)];
		}

		return static_buf.join("");
	};

	foci.rsaenc = function (msg, pub) {
		var key = new NodeRSA();
		key.importKey(new Buffer(pub, "base64"), "pkcs1-public-der");
		return key.encrypt(msg, "base64");
	};

	foci.aesenc = function (msg, key) {
		return CryptoJS.AES.encrypt(msg, key).toString();
	};

	foci.aesdec = function (enc, key) {
		var res = CryptoJS.AES.decrypt(enc, key).toString(CryptoJS.enc.Utf8);
		if (res === "") res = null;
		return res;
	};

	foci.setLocal = function (key, value) {
		return localStorage[key] = JSON.stringify(value);
	};

	foci.getLocal = function (key) {
		var val = localStorage[key];
		if (!val) return undefined;
		return JSON.parse(val);
	};

	foci.removeLocal = function (key) {
		localStorage.removeItem(key);
	};

	foci.newUser = function (lname, passwd, cb) {
		sendAsync(server + "/auth", {}, function (suc, dat) {
			if (!suc) return cb(false, "$network_error");
			if (!dat.suc) return cb(false, dat.msg);

			var pub = dat.res;

			sendAsync(server + "/user/new", {
				lname: lname,
				pkey: pub,
				penc: foci.rsaenc(passwd, pub)
			}, function (suc, dat) {
				if (!suc) return cb(false, "$network_error");
				if (!dat.suc) return cb(false, dat.msg);
				return cb(true, dat.res);
			});
		});
	};

	// cb(suc, dat/err)
	foci.login = function (lname, passwd, cb) {
		var salt = foci.salt();

		sendAsync(server + "/auth", {}, function (suc, dat) {
			if (!suc) return cb(false, "$network_error");
			if (!dat.suc) return cb(false, dat.msg);

			var pub = dat.res;

			sendAsync(server + "/user/login", {
				lname: lname,
				pkey: pub,
				penc: foci.rsaenc(salt + ":" + passwd, pub)
			}, function (suc, dat) {
				if (!suc) return cb(false, "$network_error");
				if (!dat.suc) return cb(false, dat.msg);

				var sid = foci.aesdec(dat.res.sid, salt);
				if (!sid) return cb(false, "$server_error");

				var ses = new Session(lname, dat.res.uuid, sid);

				foci.setLocal("session", ses);
				return cb(true, ses);
			});
		});
	};

	// quick login
	// cb(Session)
	foci.qlogin = function (cb) {
		var session = foci.getLocal("session");
		var clear = function () {
			foci.removeLocal("session");
		};

		if (!session) {
			return cb(false, "$no_session");
		}

		session = new Session(session);

		sendAsync(server + "/user/csid", {
			uuid: session.getUUID(),
			enc: foci.aesenc("hello", session.getSID())
		}, function (suc, dat) {
			if (!suc) {
				// clear(); no clear on network error
				return cb(false, "$network_error");
			}

			if (!dat.suc) {
				clear();
				return cb(false, "$illegal($sid)");
			}

			return cb(true, session);
		});
	};

	foci.encop = function (session, query, cb) {
		var uuid = session.getUUID();
		var sid = session.getSID();

		sendAsync(server + "/user/encop", {
			uuid: uuid,
			enc: foci.aesenc(JSON.stringify(query), sid)
		}, function (suc, dat) {
			if (!suc) return cb(false, "$network_error");
			if (!dat.suc) return cb(false, dat.msg);
			return cb(true, JSON.parse(foci.aesdec(dat.res, sid)));
		});
	};

	foci.logout = function (session, cb) {
		foci.encop(session, {
			int: "user",
			action: "logout"
		}, function (suc, dat) {
			cb(suc, dat);
		});
	};

	foci.download = function (chsum) {
		return "/file/download?chsum=" + chsum;
	};

	foci.loadCSS = function (path) {
		$("<link>")
			.attr({
				rel: "stylesheet",
				href: path
			})
			.appendTo("head");
	}

	foci.domready = require("domready");
})();
