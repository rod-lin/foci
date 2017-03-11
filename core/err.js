"use strict";

var assert = require("assert");
var util = require("./util");

exports.proc = function (cb) {
	return function (err, ret) {
		if (err) {
			util.log(err, util.style.red("ERROR"));
		} else {
			cb(ret);
		}
	};
};

exports.assert = assert.ok;
