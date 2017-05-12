/* environment */

"use strict";

if (!window.top.env)
	window.top.env = {};

define([ "com/util" ], function (util) {
	var $ = jQuery;
	var env = window.top.env;

	if (!env.storage) {
		env.storage = {};
	}

	function qlogin(cb) {
		foci.qlogin(function (suc, dat) {
			if (suc) {
				env.session = dat;
			} else {
				env.session = null;
			}

			if (cb) cb(suc, dat);
		});
	}

	function load_info(cb) {
		if (env.user && env.session) {
			cb(env.user);
			return;
		}

		if (!env.session) {
			cb(null);
			return;
		}

		foci.encop(env.session, {
			int: "info",
			action: "get"
		}, function (suc, dat) {
			if (suc) {
				env.user = dat;
			} else {
				util.emsg(dat);
				env.user = null;
			}

			cb(env.user);
		});
	}

	function favtag(cb) {
		if (env.favtag) {
			cb(env.favtag);
			return;
		}

		foci.get("/favtag", {}, function (suc, dat) {
			if (suc) {
				env.favtag = dat;
			} else {
				util.emsg(dat);
				env.favtag = null;
			}

			cb(env.favtag);
		});
	}

	function logout(cb) {
		if (!env.session) {
			if (cb) cb();
			return;
		}

		foci.logout(env.session, function () {
			env.session = null;
			env.user = null;
			if (cb) cb();
		});
	}

	function init(cb) {
		qlogin(function () {
			cb();
		});
	}

	var proc = setInterval(function () {
		qlogin();
	}, 1000);

	return {
		init: init,

		session: function (sess) {
			if (sess)
				env.session = sess;

			return env.session;
		},

		user: function (cb) {
			load_info(cb);
		},

		favtag: favtag,
		logout: logout,

		store: function (key, value) {
			env.storage[key] = value;
		},

		get: function (key) {
			if (env.storage.hasOwnProperty(key)) {
				return env.storage[key];
			}

			return undefined;
		}
	};
});
