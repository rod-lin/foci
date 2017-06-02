"use strict";

var assert = require("assert");
var util = require("./util");
var Env = require("./env").Env;

exports.assert = assert.ok;

// exception
exports.Exc = function (msg, exc) {
	this.toString = () => msg;
	this.exc = exc;
	this.stack = new Error().stack;
};

exports.Exc.prototype = {};
