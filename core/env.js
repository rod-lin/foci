"use strict";

var util = require("./util");

var Env = function (req, res) {
	var qjson = obj => {
		res.set("Content-Type", "application/json");
		res.send(JSON.stringify(obj));
	};

	this.header = obj => res.set(obj);
	this.qjson = qjson;
	this.qsuc = obj => qjson({ suc: true, res: obj });
	this.qerr = msg => qjson({ suc: false, msg: msg });

	this.query = req.query;
};

exports.Env = Env;
