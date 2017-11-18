/* system notice */

"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var util = require("./util");
var holdon = require("./holdon");
var config = require("./config");

var d = (val, def) => val === undefined ? def : val;

var SysMsg = function (smuid, conf) {
	if (arguments.length == 1) {
        util.extend(this, arguments[0]);
        return;
    }

    this.icon = d(conf.icon, "pied piper hat");
    this.msg = d(conf.msg, "(empty message)");
    this.style = d(conf.style, "");

	this.burn = d(conf.burn, true);
	this.id = smuid;

	this.ctime = d(conf.ctime, new Date());
	this.ddl = d(conf.ddl, new Date(this.ctime.getTime() + config.lim.sysmsg.default_ddl));
};

SysMsg.query = {
	dump: use_ddl => {
		var q = {};

		if (use_ddl) {
			q.ddl = { $gt: new Date() };
		}

		return q;
	}
};

exports.newMsg = async (conf) => {
    var smuid = await uid.genUID("smuid");
	var msg = new SysMsg(smuid, conf);

	var col = await db.col("sysmsg");
	
	await col.insert(msg);
    await holdon.send(holdon.chan.broadcast(), new holdon.HoldonMessage("sysmsg", msg));
};

exports.dump = async (use_ddl) => {
	var col = await db.col("sysmsg");
	var res = await col.find(SysMsg.query.dump(use_ddl)).sort({ ctime: -1 }).toArray();
	return res;
};
