/* invitation code */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var user = require("./user");
var config = require("./config");

function genInvcode(type, bit) {
    bit = bit || 8; // bit > 4
    var prefix = util.md5(type, "hex").substring(0, 4);
    var salt = util.salt(bit - 4);
    return (prefix + salt).toLowerCase();
}

exports.insertInvcode = async (type, dat) => {
    if (config.lim.invcode.allowed_type.indexOf(type) == -1)
        throw new err.Exc("$core.illegal(invcode type)");
    
    var col = await db.col("invcode");
    var code = genInvcode(type);

    await col.insertOne(({ type: type, code: code, valid: 1 }).extend(dat));
    
    return code;
};

exports.findInvcode = async (type, code) => {
    var col = await db.col("invcode");
    var dat = await col.findOne({ type: type, code: code, valid: { $gt: 0 } });

    return dat ? dat : null;
};

exports.invalidate = async (type, code) => {
    var col = await db.col("invcode");
    await col.updateOne({ type: type, code: code }, { $inc: { valid: -1 } });
};
