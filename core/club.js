/* club */

"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var util = require("./util");
var user = require("./user");
var config = require("./config");

var clubtype = exports.clubtype = {
    stuorg: 1, // student organization
    company: 2,
    other: 0
};

var clubstat = exports.clubstat = {
    review: 0, // under review
    operate: 1, // on operation
};

/* cuid shares the uid space with uuid */
/* cuid does not overlap with uuid */
var Club = function (cuid, creator, dname, type, descr) {
    if (arguments.length == 1) {
        this.extend(arguments[0]);
        return;
    }
    
    this.cuid = cuid;
    this.creator = creator;
    this.dname = dname;
    
    this.descr = descr;
    
    this.type = type || clubtype.stuorg;
    this.state = clubstat.review;
    
    this.logo = null;

    // NOTE: how title works
    // title in the member object can be a arbitrary string defined by the owner
    // and special titles will be defined here with various properties
    this.def_title = {};
    // title format: {
    //     [title]: {
    //         // empty
    //     }
    // }
    
    this.apply_member = {};
    this.member = {
        [creator]: {
            title: null,
            join_time: new Date(),
            is_admin: true
        }
    };
    
    // member format: {
    //     [uuid]: { 
    //         title /* string, defined in this.def_title */,
    //         join_time /* date, time of join */,
    //         is_admin
    //     }
    // }
};

Club.prototype = {};

Club.prototype.getCUID = function () {
    return this.cuid;
};

Club.prototype.getState = function () {
    return this.state;
};

// get info related to a user
Club.prototype.getRelatedInfo = function (uuid) {
    return {
        cuid: this.cuid,
        dname: this.dname,
        logo: this.logo,
        state: this.state,
        relation: (() => {
            if (this.apply_member[uuid])
                return "app";
            else if (this.creator == uuid)
                return "creator";
            else if (this.member[uuid])
                return "member";
            else
                return null;
        })()
    }
};

exports.Club = Club;

Club.query = {
    cuid: cuid => ({ "cuid": cuid }),
    member_exist: (cuid, uuid) => ({ "cuid": cuid, ["member." + uuid]: { $exists: true } }),
    apply_exist: (cuid, uuid) => ({ "cuid": cuid, ["apply_member." + uuid]: { $exists: true } }),
    
    check_admin: (cuid, uuid) => ({
        $or: [
            {
                cuid: cuid,
                creator: uuid,
            },
            {
                cuid: cuid,
                ["member." + uuid + ".is_admin"]: true
            }
        ]
    }),
    
    related_club: uuid => ({
        $or: [
            {
                creator: uuid,
            }, {
                ["member." + uuid]: { $exists: true }
            }, {
                ["apply_member." + uuid]: { $exists: true }
            }
        ]
    })
};

Club.set = {
    publish: () => ({ $set: { "state": clubstat.operate } }),
    add_apply: (uuid, comment) => ({ $set: { ["apply_member." + uuid]: { comment: comment } } }),

    remove_apply: uuid => ({
        $unset: {
            ["apply_member." + uuid]: null
        },
    }),
        
    add_member: uuid => ({
        $unset: {
            ["apply_member." + uuid]: null
        },
        
        $set: {
            ["member." + uuid]: {
                title: null,
                join_time: new Date(),
                is_admin: false
            }
        }
    })
};

function checkClubName(name) {
    return name && name.length <= config.lim.club.max_name_len &&
           /^[0-9a-zA-Z_\-@. '"]+$/g.test(name);
}

exports.checkClubExist = async (cuid) => {
    var col = await db.col("club");
	
    if (!await col.count(Club.query.cuid(cuid)))
        throw new err.Exc("$core.not_exist($core.word.club)");
};

exports.newClub = async (creator, dname, type, descr) => {
    if (!checkClubName(dname))
        throw new err.Exc("$core.club.illegal_name");
    
    var col = await db.col("club");
    
    var cuid = await uid.genUID("user"); // cuid == uuid
    var club = new Club(cuid, creator, dname, type, descr);

    await col.insertOne(club);

    return club;
};

exports.checkAdmin = async (cuid, uuid) => {
    var col = await db.col("club");
    
    if (!await col.count(Club.query.check_admin(cuid, uuid)))
        throw new err.Exc("$core.club.not_club_owner");
};

exports.cuid = async (cuid) => {
    var col = await db.col("club");
	var found = await col.findOne(Club.query.cuid(cuid));

	if (!found)
		throw new err.Exc("$core.not_exist($core.word.club)");

	return new Club(found);
};

// get clubs related to a user
exports.getRelatedClub = async (uuid) => {
    var col = await db.col("club");
    var all = await col.find(Club.query.related_club(uuid)).toArray();
    var ret = [];
    
    /*
        {
            cuid, dname, logo, relation
        }
     */
     
     for (var i = 0; i < all.length; i++) {
         ret.push((new Club(all[i])).getRelatedInfo(uuid));
     }
     
     return ret;
};

exports.publish = async (cuid, uuid) => {
    var club = await exports.cuid(cuid);
    
    await user.checkAdmin(uuid);
    
    if (club.getState() != clubstat.review)
        throw new err.Exc("$core.club.already_reviewed");
    
    var col = await db.col("club");
    
    await col.updateOne(Club.query.cuid(cuid), Club.set.publish());
};

exports.checkMemberExist = async (cuid, uuid, should_exist) => {
    var col = await db.col("club");
    var count = await col.count(Club.query.member_exist(cuid, uuid));

    if (should_exist && !count) {
        throw new err.Exc("$core.club.member_not_exist");
    } else if (!should_exist && count) {
        throw new err.Exc("$core.club.member_exist");
    }
};

exports.checkApplyExist = async (cuid, uuid, should_exist) => {
    var col = await db.col("club");
    var count = await col.count(Club.query.apply_exist(cuid, uuid));

    if (should_exist && !count) {
        throw new err.Exc("$core.club.apply_not_exist");
    } else if (!should_exist && count) {
        throw new err.Exc("$core.club.apply_exist");
    }
};

exports.applyMember = async (cuid, uuid, comment) => {
    await exports.checkClubExist(cuid);
    
    var col = await db.col("club");
    
    await exports.checkMemberExist(cuid, uuid, false);
    await exports.checkApplyExist(cuid, uuid, false);
    
    await col.updateOne(Club.query.cuid(cuid), Club.set.add_apply(uuid, comment));
};

exports.changeApply = async (cuid, uuid, applicant, accept) => {
    await exports.checkClubExist(cuid);
    await exports.checkAdmin(cuid, uuid);
    await exports.checkApplyExist(cuid, applicant, true);
    
    var col = await db.col("club");
    
    if (accept) {
        await col.updateOne(Club.query.cuid(cuid), Club.set.add_member(applicant));
    } else {
        await col.updateOne(Club.query.cuid(cuid), Club.set.remove_apply(applicant));
    }
};
