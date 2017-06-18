"use strict";

var assert = require("assert");
var util = require("./util");
var Env = require("./env").Env;

exports.assert = function (cond, msg) {
	if (!cond)
		throw new exports.Exc(msg || "$core.assert_failed");
};

// exception
exports.Exc = function (msg, exc) {
	this.toString = () => msg;
	this.exc = exc;
	this.stack = new Error().stack;
};

exports.Exc.prototype = {};
