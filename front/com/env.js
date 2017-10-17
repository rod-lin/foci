/* environment */

"use strict";

if (!window.env)
	window.env = {};

define([ "com/util" ], function (util) {
	var $ = jQuery;
	var env = window.env;

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
	
	function load_rating(cb) {
		if (env.rating && env.session) {
			cb(env.rating);
			return;
		}
		
		if (!env.session) {
			cb(NaN);
			return;
		}
		
		foci.get("/user/rating", {
			uuid: env.session.getUUID()
		}, function (suc, dat) {
			if (suc) {
				env.rating = dat;
			} else {
				util.emsg(dat);
				env.rating = NaN;
			}

			cb(env.rating);
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
			
			load_rating(function (rating) {
				env.user.rating = isNaN(rating) ? 0 : rating;
				cb(env.user);
			});
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

	var cbs = {};

	function setOn(name, cb) {
		if (!cbs.hasOwnProperty(name))
			cbs[name] = [];

		cbs[name].push(cb);
	}

	function emit(name, val) {
		var lst = cbs[name];

		if (lst)
			for (var i = 0; i < lst.length; i++) {
				lst[i](val);
			}
	}

	var proc = setInterval(function () {
		qlogin();
	}, 10 * 60 * 1000); // 10 min

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
		
		clearUserCache: function () {
			env.user = null;
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
		},

		emit: function (event ,val) {
			emit(event, val);
		},

		on: function (event, cb) {
			setOn(event, cb);
		}
	};
});
