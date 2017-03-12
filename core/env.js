"use strict";

var util = require("./util");

var Env = function (req, res) {
	var qjson = obj => res.send(JSON.stringify(obj));

	this.header = obj => res.set(obj);
	this.qjson = qjson;
	this.qsuc = obj => qjson({ suc: true, res: obj });
	this.qerr = msg => qjson({ suc: false, msg: msg });
};

exports.Env = Env;
