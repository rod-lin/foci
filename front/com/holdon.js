/* client side of holdon */

"use strict";

define([ "com/util", "com/env" ], function (util, env) {
	var SLEEP_MODE_THRESHOLD = 10; // if 10 consecutive errors, then switch to sleep mode

	// intervals between consecutive holdon calls
	var NORMAL_INTERVAL = 3000;
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

	// missed message by unregistered module
	var missed_msg = {};

	function trigger(mod, data) {
		if (reg_mod.hasOwnProperty(mod)) {
			var conf = reg_mod[mod];
			if (conf.proc) conf.proc(data);
		} else {
			conmsg("unregistered module " + mod, data);

			if (!missed.hasOwnProperty(mod))
				missed[mod] = [];

			missed[mod].push(data);
		}
	}

	var last_time = undefined;

	holdon.init = function () {
		if (has_init) return;

		var listen = function (cb) {
			var next = function (suc, dat) {
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
			};

			var session = env.session();

			if (session)
				foci.encop(session, { int: "holdon", action: "listenenc", ltime: last_time }, next);
			else
				foci.get("/holdon/listenbc", { ltime: last_time }, next);
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
	
		// restore missed messages
		if (missed_msg.hasOwnProperty(name) && missed_msg[name].length) {
			var missed = missed_msg[name];
			missed_msg[name] = [];

			for (var i = 0; i < missed.length; i++) {
				trigger(name, missed[i]);
			}
		}
	};

    return holdon;
});
