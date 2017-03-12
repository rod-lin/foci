"use strict";

var util = require("./util");

var Env = function (req, res) {
	this.header = obj => res.set(obj);
	this.qsuc = obj => this.qjson({ suc: true, res: obj });
	this.qjson = obj => res.send(JSON.stringify(obj));
};

exports.Env = Env;
