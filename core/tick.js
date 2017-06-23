/* tick: event handling */

"use strict";

var err = require("./err");
var util = require("./util");

var router = {};

// bind an event
exports.on = (ev, cb) => {
	if (!router.hasOwnProperty(ev))
		router[ev] = [];

	router[ev].push(cb);

	return exports;
};

// trigger an event
exports.emit = function (ev) {
	var args = Array.prototype.slice.call(arguments, 1);
	var hand = router[ev];

	if (hand)
		for (var i = 0; i < hand.length; i++)
			hand[i].apply(undefined, args);

	return exports;
};

// async wrapper
exports.awrap = proc => {
	return async function () {
		try {
			var args = Array.prototype.slice.call(arguments);
			return await proc.apply(undefined, args);
		} catch (e) {
			if (e instanceof err.Exc) {
				util.log(e, util.style.yellow("TICK EXCEPTION"));

				if (e.exc) {
					util.log(e.exc.stack, util.style.yellow("TICK ERROR"));
				} else {
					util.log(e.stack, util.style.blue("TICK STACK"));
				}
			} else {
				util.log(e.stack, util.style.red("TICK ERROR"));
			}
		}
	};
};
