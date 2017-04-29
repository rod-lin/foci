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

	Array.prototype.choose = function () {
		return this[Math.floor(Math.random() * this.length)];
	};

	return util;
});
