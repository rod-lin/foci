/* util */

"use strict";

define(function () {
	var util = {};

	util.short = function (str, max, fill) {
		fill = fill || "...";

		if (str.length > max) {
			return str.substr(0, max - fill.length) + fill;
		}

		return str;
	};

	util.qmsg = function (str) {
		alert("debug error: " + str);
	};

	util.listen = function (dob) {
		var proc = setInterval(function () {
			if (dob()) clearInterval(proc);
		}, 0);
	};

	// async times
	util.atimes = function (dob, time) {
		var i = 0;
		var proc = setInterval(function () {
			dob(); i++;
			if (i > time) clearInterval(proc);
		}, 0);
	};

	util.media = function (max_width, cb) {
		$(window).on("resize", function () {
			if ($(window).width() <= max_width)
				cb();
		});
	};

	Array.prototype.choose = function () {
		return this[Math.floor(Math.random() * this.length)];
	};

	return util;
});
