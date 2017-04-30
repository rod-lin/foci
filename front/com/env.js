/* environment */

"use strict";

window.env = {};

define([ "com/util" ], function (util) {
	var $ = jQuery;

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

		foci.encop(env.session, {
			int: "info",
			action: "get"
		}, function (suc, dat) {
			if (suc) {
				env.user = dat;
			} else {
				util.qmsg(dat);
				env.user = null;
			}

			cb(env.user);
		});
	}

	function logout(cb) {
		if (!env.session) {
			if (cb) cb();
			return;
		}

		foci.logout(env.session, function () {
			env.session = null;
			if (cb) cb();
		});
	}

	function init(cb) {
		qlogin(function () {
			cb();
		});
	}

	// var proc = setInterval(function () {
	// 	qlogin(function (suc, dat) {
	// 		if (!suc) util.qmsg(dat);
	// 		else clearInterval(proc);
	// 	});
	// }, 7000);

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

		logout: logout
	};
});
