/* cover settings */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var user = require("./user");
var config = require("./config");

var Cover = {};

/*
    {
        pboard: [
            {
                img: "file id",
                url
            },

            ... 4 in total
        ]

    }
 */

Cover.query = {
    conf: () => ({})
};

Cover.set = {
    pboard: (n, info) => {
        var q = { $set: {} };
        q.$set["pboard." + n] = info;
        return q;
    },

    init_pboard: () => ({
        $set: { "pboard": [] }
    })
};

async function init() {
    var col = await db.col("cover");
    var found = await col.findOne(Cover.query.conf());

    if (!found) {
        await col.insert(Cover.query.conf());
    }
}

exports.setPBoard = async (uuid, n, info) => {
    await user.checkAdmin(uuid);
    await init();

    var col = await db.col("cover");

    var found = await col.findOne(Cover.query.conf());

    if (!found.pboard) {
        await col.findOneAndUpdate(Cover.query.conf(), Cover.set.init_pboard());
    }

    await col.findOneAndUpdate(Cover.query.conf(), Cover.set.pboard(n, info));
};

exports.getPBoard = async () => {
    await init();

    var col = await db.col("cover");
    var found = await col.findOne(Cover.query.conf());

    return found && found.pboard ? found.pboard : [];
};
