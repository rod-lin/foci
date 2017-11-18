/* client side of holdon */

"use strict";

define([ "com/util" ], function (util) {
	var SLEEP_MODE_THRESHOLD = 5; // if 5 consecutive errors, then switch to sleep mode

	// intervals between consecutive holdon calls
	var NORMAL_INTERVAL = 5000;
	var SLEEP_INTERVAL = 30000;

	var holdon = {};

	var has_init = false;
	var reg_mod = {}; // registered mod
	/**
	 * reg mod { name: { proc(data) } }
	 */

	function conmsg(msg) {
		var args = Array.prototype.slice.apply(arguments);
		console.log.call(console, [ "holdon: " ] + args);
	}

	function trigger(mod, data) {
		if (reg_mod.hasOwnProperty(mod)) {
			var conf = reg_mod[mod];
			if (conf.proc) conf.proc(data);
		} else {
			conmsg("unregistered module " + mod, data);
		}
	}

	var last_time = undefined;

	holdon.init = function () {
		if (has_init) return;

		var listen = function (cb) {
			foci.get("/holdon/listenbc", { ltime: last_time },
			function (suc, dat) {
				last_time = new Date().getTime();

				if (suc) {
					if (dat !== null) {
						for (var i = 0; i < dat.length; i++) {
							try {
								trigger(dat[i].module, dat[i].data);
							} catch (e) {
								util.sidethrow(new Error("uncaught holdon error: " + e.stack));
							}
						}
					}
				} else {
					// util.emsg(dat);
				}

				cb(suc && dat !== null);
			});
		};

		var fail_count = 0;
		var sleep_mode = false;

		var next = function (suc) {
			if (suc) {
				fail_count = 0;
				sleep_mode = false;
			} else if (!sleep_mode && ++fail_count >= SLEEP_MODE_THRESHOLD) {
				sleep_mode = true;
				conmsg("switch to sleep mode");
			}

			setTimeout(function () {
				listen(next);
			}, sleep_mode ? SLEEP_INTERVAL : NORMAL_INTERVAL);
		};

		listen(next);

		has_init = true;
	};

	holdon.reg = function (name, conf) {
		if (reg_mod.hasOwnProperty(name)) {
			conmsg("duplicated registration " + name, conf);
			return;
		}

		holdon.init();

		reg_mod[name] = conf;
	};

    return holdon;
});
