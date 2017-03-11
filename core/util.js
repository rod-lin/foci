"use strict";

exports.style = require("cli-color");
exports.log = function (msg, dir) {
	console.log("%s: %s%s", new Date(), dir ? dir + ": " : "", msg);
}
