"use strict";

// import jQuery individually
// window.jQuery = window.$ = require("jquery");

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
			xss.whiteList[k].push("class");
		}
	}
	
	xss.whiteList["a"].push("data-jumptag-type");
	xss.whiteList["a"].push("data-jumptag-uid");
	xss.whiteList["img"].push("data-src");
	xss.whiteList["qqmusic"] = [];
	
	var color_reg = /^\s*(((rgb|rgba)\s*\(\s*\d*.\d*\s*,\s*\d*.\d*\s*,\s*\d*.\d*\s*(,\s*\d*.\d*\s*)?\))|#[0-9a-fA-F]+)\s*$/;
	
	var filt = new xss.FilterXSS({
		whiteList: xss.whiteList,

		onIgnoreTag: function (tag, html, options) {
			if (tag.substr(0, 2) === "o:") {
				return html;
			}
		},

		css: {
			whiteList: {
				"text-align": /^left|center|right$/,
				"display": /.*/,
				
				"background": /.*/,
				"background-color": color_reg,
				"background-repeat": /.*/,
				"background-image": /.*/,
				"background-size": /.*/,
				"background-position": /.*/,
				
				"border": /.*/,
				"border-top": /.*/,
				"border-bottom": /.*/,
				"border-left": /.*/,
				"border-right": /.*/,
				
				"border-style": /.*/,
				"border-top-style": /.*/,
				"border-bottom-style": /.*/,
				"border-left-style": /.*/,
				"border-right-style": /.*/,
				
				"border-color": /.*/,
				"border-top-color": /.*/,
				"border-bottom-color": /.*/,
				"border-left-color": /.*/,
				"border-right-color": /.*/,
				
				"border-width": /.*/,
				"border-top-width": /.*/,
				"border-bottom-width": /.*/,
				"border-left-width": /.*/,
				"border-right-width": /.*/,
				
				"border-radius": /.*/,
				"border-top-left-radius": /.*/,
				"border-top-right-radius": /.*/,
				"border-bottom-left-radius": /.*/,
				"border-bottom-right-radius": /.*/,
				
				"vertical-align": /.*/,
				
				"margin": /.*/,
				"margin-top": /.*/,
				"margin-bottom": /.*/,
				"margin-left": /.*/,
				"margin-right": /.*/,
				
				"padding": /.*/,
				"padding-top": /.*/,
				"padding-bottom": /.*/,
				"padding-left": /.*/,
				"padding-right": /.*/,
				
				"box-sizing": /.*/,
				
				"overflow": /.*/,
				
				"width": /.*/,
				"height": /.*/,
				
				"font-size": /.*/,
				"font-weight": /.*/,
				"font-family": /.*/,
				"font-style": /.*/,
				
				"transform": /.*/,
				"-webkit-transform": /.*/,
				"-o-transform": /.*/,
				"-moz-transform": /.*/,
				
				"color": /.*/,
				"opacity": /.*/
			}
		}
	});
	
	return function (cont) {
		return filt.process(cont);
	};
})();

// polyfills
(function () {
	var global = window;

	if (typeof global.ArrayBuffer !== "function") {
		return;
	}

	/*!
	 * This polyfill is implemented by
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */

	function isBuffer(b) {
		if (global.Buffer && typeof global.Buffer.isBuffer === "function") {
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

	var crypto = global.crypto || global.msCrypto;

	if (!crypto) {
		crypto = global.crypto = {};
	}

	// polyfill for crypto.getRandomValues
	if (!crypto.getRandomValues) {
		global.crypto.getRandomValues = require("polyfill-crypto.getrandomvalues");
	}
})();

if (!window.foci)
	window.foci = {};

(function () {
	var NodeRSA = require("node-rsa");
	var CryptoJS = require("crypto-js");

	var server = "";

	var Session = function (lname, uuid, sid, is_admin, is_root) {
		if (uuid === undefined) {
			$.extend(this, lname);
			return;
		}

		this.lname = lname;
		this.uuid = uuid;
		this.sid = sid;
		
		this.is_admin = is_admin;
		this.is_root = is_root;
	};

	Session.prototype = {};
	Session.prototype.getUUID = function () { return this.uuid; };
	Session.prototype.getSID = function () { return this.sid; };
	Session.prototype.isAdmin = function () { return this.is_admin; };
	Session.prototype.isRoot = function () { return this.is_root; };

	function noCacheData(data) {
		var v = (new Date()).getTime();

		if (FormData && data instanceof FormData) {
			data.append("v", v);
		} else {
			data = $.extend({ v: v }, data || {});
		}

		return data;
	}

	var sendSync = function (url, data, method, ext) {
		data = noCacheData(data); // disable cache

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
		// alert([ url, data, cb, method, ext ]);

		data = noCacheData(data); // disable cache
		
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

	// callbacks for requests rejected by captcha
	var captcha_cb = [];
	var on_captcha = false;
	
	function req_callback(method, url, data, cb, ext) {
		return function (suc, dat) {
			if (!suc) return cb(false, "$def.network_error");
			
			if (!dat.suc) {
				if (dat.cap) {
					if (on_captcha && !dat.no_buf) { // already requested
						captcha_cb.push(function () {
							// simply retry without captcha
							method(url, data, cb, ext);
						});
					} else {
						if (foci.captcha()) {
							on_captcha = true;
							
							foci.captcha()(dat.dat, function (suc, ans) {
								if (suc) {
									// resend the request
									if (FormData && data instanceof FormData) {
										// console.log("using form data");
										data.append("capans", JSON.stringify(ans));
									} else {
										// console.log("using urlencode");
										data = $.extend(data, { capans: ans });
									}
									
									method(url, data, (function (cbs) {
										// wrap the original callback
										return function (suc, dat) {
											// retry all the blocked requests
											for (var i = 0; i < cbs.length; i++) {
												cbs[i]();
											}
											
											cb(suc, dat);
										};
									})(captcha_cb), ext);
								} else {
									cb(false, ans);
								}
								
								// reopen captcha
								captcha_cb = [];
								on_captcha = false;
							});
							
							return;
						} else return cb(false, "$def.uninit_recaptcha");
					}
				} else
					return cb(false, dat.msg);
			}
			
			return cb(true, dat.res);
		};
	}

	foci.sget = sendSync;
	foci.get = function (url, data, cb, ext) {
		sendAsync(url, data, req_callback(foci.get, url, data, cb, ext), "GET", ext);
	};

	foci.post = function (url, data, cb, ext) {
		sendAsync(url, data, req_callback(foci.post, url, data, cb, ext),
				  "POST", $.extend({ cache: false, contentType: false, processData: false }, ext));
	};

	foci.epost = function (url, data, cb, ext) {
		sendAsync(url, data, req_callback(foci.epost, url, data, cb, ext), "POST", ext);
	};

	// captcha wrap
	// method: foci.get, foci.post, etc.
	foci.capwrap = function (method, url, data, cb, ext) {
		sendAsync("/cap", {}, function (suc, dat) {
			dat.no_buf = true; // avoid cap callback buffered
			req_callback(method, url, data, cb, ext)(suc, dat);
		}, "GET");
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

	var nolocal_cb = null;

	// nolocal event is triggered when localStorage is not supported(e.g. in private mode)
	foci.nolocal = function (cb) {
		if (cb !== undefined) {
			nolocal_cb = cb;
		} else if (nolocal_cb) {
			nolocal_cb();
		}
	};

	foci.localEnabled = function () {
		var enabled = false;

		try {
			localStorage["test"] = "1";
			localStorage.removeItem("test");
		} catch (e) {
			enabled = false;
		}

		return enabled;
	};

	foci.setLocal = function (key, value) {
		var ret;

		try {
			ret = localStorage[key] = JSON.stringify(value);
		} catch (e) {
			foci.nolocal();
		}

		return ret;
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

				var ses = new Session(lname, dat.uuid, sid, dat.admin, dat.root);

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
		if (!session || !(session instanceof Session)) {
			cb(false, "$def.no_login");
			return;
		}

		var uuid = session.getUUID();
		var sid = session.getSID();
		
		foci.epost("/user/encop", {
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

	foci.download = function (chsum, config) {
		config = config || {};
		return "/file/download?chsum=" +
			   chsum +
			   (config.tmp ? "&tmp=true" : "") +
			   (config.thumb !== undefined ? "&thumb=" + config.thumb : "&thumb=3");
	};

	foci.loadCSS = function (path) {
		$("<link>")
			.attr({
				rel: "stylesheet",
				href: path + (foci.version ? "?v=" + foci.version : "")
			})
			.appendTo("head");
	};

	foci.loadCSSPlain = function (sheet) {
		$("head").append("<style>" + sheet + "</style>");
	};

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
		rejected: -100,
		review: 0,
		frozen: 50,
	    operate: 100
	};
})();
