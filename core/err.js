"use strict";

var assert = require("assert");
var util = require("./util");
var Env = require("./env").Env;

exports.assert = assert.ok;

// exception
exports.Exc = function (msg) {
	this.toString = () => msg;
};

exports.Exc.prototype = {};
