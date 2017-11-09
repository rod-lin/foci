/* club utility */

"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var util = require("./util");
var user = require("./user");
var file = require("./file");
var config = require("./config");
var notice = require("./notice");
var template = require("./template");

var CUtil = function (cuuid, conf) {
    if (arguments.length == 1) {
        util.extend(this, arguments[0]);
        return;
    }

    this.cuuid = cuuid;

    this.cover = conf.cover || null;
    this.admin = conf.admin || [];

    this.name = conf.name || "";
    this.descr = conf.descr || "";

    this.url = conf.url || ""; // url will be formatted as #discover/<cuuid>/<url>/...

    this.enable = false;
};

CUtil.prototype = {};

CUtil.prototype.getCUUID = function () {
    return this.cuuid;
};

CUtil.prototype.getCover = function () {
    return this.cover;
};

CUtil.prototype.getName = function () {
    return this.name;
};

CUtil.prototype.getAdmin = function () {
    return this.admin;
};

CUtil.prototype.getURL = function () {
    return this.url;
};

exports.CUtil = CUtil;

CUtil.format = {};
CUtil.format.info = {
    name: util.checkArg.lenlim(config.lim.cutil.max_name, "$core.too_long($core.word.name)"),
    descr: util.checkArg.lenlim(config.lim.cutil.max_descr, "$core.too_long($core.word.descr)"),

    url: util.checkArg.lenlim(config.lim.cutil.max_url, "$core.too_long($core.word.url)"),
    enable: "bool",

    admin: {
        type: "array", lim: admin => {
			for (var i = 0; i < admin.length; i++) {
				if (typeof admin[i] != "number") {
					admin[i] = parseInt(admin[i]);
				}
				
				if (isNaN(admin[i]) || admin[i] < 0) {
					throw new err.Exc("$core.illegal($core.word.cuuid)");
				}
			}
			
			return admin;
		}
    },

    cover: {
        type: "string", lim: chsum => {
			if (!file.isLegalID(chsum))
				throw new err.Exc("$core.illegal($core.word.file_id)");
			return chsum;
		}
    }
};

CUtil.query = {
    cuuid: cuuid => ({
        cuuid: cuuid
    }),

    check_admin: (cuuid, uuids) => ({
        cuuid: cuuid,
        admin: uuids
    })
};

CUtil.set = {
    info: conf => ({
        $set: conf
    }),

    set_enabled: is_enabled => ({
        enabled: is_enabled
    })
};

exports.existCUtil = async (cuuid) => {
    var col = await db.col("cutil");
    return !! await col.count(CUtil.query.cuuid(cuuid));
};

var checkCUtilExist = async (cuuid) => {
    var col = await db.col("cutil");

    if (!await col.count(CUtil.query.cuuid(cuuid))) {
        throw new err.Exc("$core.not_exist($core.word.cutil)");
    }
};

var checkResponsible = exports.checkResponsible = async (cuuid, uuids) => {
    var col = await db.col("cutil");
    
    if (!await col.count(CUtil.query.check_admin(cuuid, uuids))) {
        throw new err.Exc("$core.cutil.not_responsible");
    }
};

exports.cuuid = async (cuuid) => {
    var col = await db.col("cutil");
    var found = await col.findOne(CUtil.query.cuuid(cuuid));

    if (!found) {
        throw new err.Exc("$core.not_exist($core.word.cutil)");
    }

    return new CUtil(found);
};

exports.newUtil = async (conf) => {
    var cuuid = await uid.genUID("cuuid");
    var utl = new CUtil(cuuid, conf);

    var col = await db.col("cutil");

    await col.insert(utl);

    return utl;
};

exports.setInfo = async (cuuid, uuid, conf) => {
    var col = await db.col("cutil");

    await user.checkAdmin(uuid);
    await checkCUtilExist(cuuid);

    await col.updateOne(CUtil.query.cuuid(cuuid), CUtil.set.info(conf));
};

exports.getAllUtil = async (show_disabled) => {
    var col = await db.col("cutil");
    var q = {};

    if (!show_disabled)
        q.enable = true

    var found = await col.find(q).toArray();
    var ret = [];

    found.forEach(utl => ret.push(new CUtil(utl)));

    return ret;
};

exports.submit = async (cuuid, uuid, form) => {
    var utl = await exports.cuuid(cuuid);
    await notice.sendGroup(
        "cutil", cuuid, uuid, utl.getAdmin(),
        await template.cutil_form_submit(
            uuid, cuuid,
            "#discover/" + cuuid + "/" + utl.getURL() + "/" + encodeURIComponent(JSON.stringify(form))));
};

exports.enable = async (cuuid, is_enabled) => {
    var col = await db.col("cutil");
    await col.updateOne(CUtil.query.cuuid(cuuid), CUtil.set.set_enabled(is_enabled));
};
