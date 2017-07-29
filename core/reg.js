/* registration */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var config = require("./config");

exports.genCode = function (len) {
    len = len || config.reg.vercode_len;
    var code = "";
    while (len--) code += Math.floor(Math.random() * 10);
    return code;
};

exports.insert = async (index, code) => {
    var col = await db.col("regveri");

    col.findOneAndUpdate(
        { index: index },
        { $set: { index: index, code: code, stamp: util.stamp() } },
        { upsert: true }
    );
};

exports.verify = async (index, code) => {
    var col = await db.col("regveri");

    var ret = (await col.findOneAndDelete({ index: index, code: code })).value;

    if (!ret) {
        throw new err.Exc("$core.reg.failed_verify");
    }

    if (util.stamp() - ret.stamp > config.reg.timeout) {
        throw new err.Exc("$core.reg.vercode_timeout");
    }
};
