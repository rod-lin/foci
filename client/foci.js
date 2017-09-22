"use strict";

window.jQuery = window.$ = require("jquery");
window.markdown = (function () {
	var showdown = require("showdown");
	var conv = new showdown.Converter({
		simplifiedAutoLink: true,
		excludeTrailingPunctuationFromURLs: true,
		strikethrough: true,
		tables: true,
		tablesHeaderId: true,
		// simpleLineBreaks: true
	});

	var mod = {
		toHTML: function (src) {
			return "<div class='markdown-body'>" + xssfilt(conv.makeHtml(src)) + "</div>";
		},

		toText: function (src) {
			return $(mod.toHTML(src))[0].innerText;
		}
	};

	return mod;
})();

window.xssfilt = (function () {
	var xss = require("xss");
	xss.whiteList["strike"] = xss.whiteList["s"] = xss.whiteList["a"];
	
	for (var k in xss.whiteList) {
		if (xss.whiteList.hasOwnProperty(k)) {
			xss.whiteList[k].push("style");
		}
	}
	
	var filt = new xss.FilterXSS({
		whiteList: xss.whiteList,
		css: {
			whiteList: {
				"text-align": /^left|center|right$/,
				"font-size": /.*/,
				"font-weight": /.*/,
				"font-family": /.*/,
				"font-style": /.*/
		    }
		}
	});
	
	return function (cont) {
		return filt.process(cont);
	};
})();

(function () {
	var global = window;

	if (typeof global.ArrayBuffer !== 'function') {
		return;
	}

	/*!
	 * This polyfill is implemented by
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */

	function isBuffer(b) {
		if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
			return global.Buffer.isBuffer(b);
		}

		return !!(b != null && b._isBuffer);
	}

	ArrayBuffer.isView = ArrayBuffer.isView || function (arrbuf) {
		if (isBuffer(arrbuf)) {
			return false;
		}

		if (!arrbuf) {
			return false;
		}

		if (arrbuf instanceof DataView) {
			return true;
		}

		if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
			return true;
		}

		return false;
	};
})();

window.foci = {};

(function () {
	var NodeRSA = require("node-rsa");
	var CryptoJS = require("crypto-js");

	var server = "";

	var Session = function (lname, uuid, sid, is_admin) {
		if (uuid === undefined) {
			$.extend(this, lname);
			return;
		}

		this.lname = lname;
		this.uuid = uuid;
		this.sid = sid;
		
		this.is_admin = is_admin;
	};

	Session.prototype = {};
	Session.prototype.getUUID = function () { return this.uuid; };
	Session.prototype.getSID = function () { return this.sid; };
	Session.prototype.isAdmin = function () { return this.is_admin; };

	var sendSync = function (url, data, method, ext) {
		var res = $.ajax($.extend({
			type: method || "GET",
			async: false,
			url: url,
			dataType: "json",
			data: data
		}, ext)).responseText;

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
		}, ext));
	};
	
	// function (cap, cb) { ... show and verify recaptcha and call cb with returned parameters from captcha }
	var captcha_handler = null;
	
	// set captcha handler
	foci.captcha = function (cb) {
		if (cb !== undefined) {
			captcha_handler = cb;
		} else return captcha_handler;
	};
	
	function req_callback(method, url, data, cb) {
		return function (suc, dat) {
			if (!suc) return cb(false, "$def.network_error");
			
			if (!dat.suc) {
				if (dat.cap) {
					if (foci.captcha()) {
						foci.captcha()(dat.dat, function (suc, ans) {
							if (suc) {
								// resend the request
								method(url, $.extend(data, { capans: ans }), cb);
							} else {
								cb(false, ans);
							}
						});
						
						return;
					} else
						return cb(false, "$def.uninit_recaptcha");
				} else
					return cb(false, dat.msg);
			}
			
			return cb(true, dat.res);
		};
	}

	foci.sget = sendSync;
	foci.get = function (url, data, cb) {
		sendAsync(url, data, req_callback(foci.get, url, data, cb));
	};

	foci.post = function (url, data, cb) {
		sendAsync(url, data, req_callback(foci.post, url, data, cb),
				  "POST", { cache: false, contentType: false, processData: false });
	};

	foci.salt = function (len) {
		var static_buf = new Array(len || 16);
		var tab = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		for (var i = 0; i < static_buf.length; i++) {
			static_buf[i] = tab[Math.floor(Math.random() * tab.length)];
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

	foci.newUser = function (lname, vercode, passwd, cb) {
		foci.get("/auth", {}, function (suc, dat) {
			if (!suc) return cb(false, dat);
			
			foci.get("/user/new", {
				lname: lname,
				vercode: vercode,
				pkey: dat,
				penc: foci.rsaenc(passwd, dat)
			}, cb);
		});
	};
	
	foci.resetPass = function (lname, vercode, passwd, cb) {
		foci.get("/auth", {}, function (suc, dat) {
			if (!suc) return cb(false, dat);
			
			foci.get("/user/reset", {
				lname: lname,
				vercode: vercode,
				pkey: dat,
				penc: foci.rsaenc(passwd, dat)
			}, cb);
		});
	};

	// cb(suc, dat/err)
	foci.login = function (lname, passwd, cb) {
		var salt = foci.salt();
		
		foci.get("/auth", {}, function (suc, dat) {
			if (!suc) return cb(false, dat);
			
			foci.get("/user/login", {
				lname: lname,
				pkey: dat,
				penc: foci.rsaenc(salt + ":" + passwd, dat)
			}, function (suc, dat) {
				if (!suc) return cb(false, dat);
				
				var sid = foci.aesdec(dat.sid, salt);
				if (!sid) return cb(false, "$def.server_error");

				var ses = new Session(lname, dat.uuid, sid, dat.admin);

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
			return cb(false, "$def.no_session");
		}

		session = new Session(session);

		foci.get("/user/csid", {
			uuid: session.getUUID(),
			enc: foci.aesenc("hello", session.getSID())
		}, function (suc, dat) {
			if (!suc) {
				if (dat != "$def.network_error")
					clear();
				return cb(false, dat);
			}
			
			return cb(true, session);
		});
	};

	foci.encop = function (session, query, cb) {
		var uuid = session.getUUID();
		var sid = session.getSID();
		
		foci.get("/user/encop", {
			uuid: uuid,
			enc: foci.aesenc(JSON.stringify(query), sid)
		}, function (suc, dat) {
			if (!suc) return cb(false, dat);
			return cb(true, JSON.parse(foci.aesdec(dat, sid)));
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
				href: path + (foci.version ? "?v=" + foci.version : "")
			})
			.appendTo("head");
	}

	foci.domready = require("domready");
	
	foci.evstat = {
		all: -Infinity,
		review: -1,
		draft: 0,
		published: 1,
		terminated: 2
	};
	
	foci.clubstat = {
		all: -Infinity,
		review: 0,
	    operate: 1
	};
})();
