/* club */

"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var util = require("./util");
var user = require("./user");
var file = require("./file");
var config = require("./config");

var clubtype = exports.clubtype = {
    stuorg: 1, // student organization
    company: 2,
    other: -1
};

var clubstat = exports.clubstat = {
    all: -Infinity,
    review: 0, // under review
    operate: 1 // on operation
};

/* cuid shares the uid space with uuid */
/* cuid does not overlap with uuid */
var Club = function (cuid, creator, conf) {
    if (arguments.length == 1) {
        this.extend(arguments[0]);
        return;
    }
    
    this.cuid = cuid;
    this.creator = creator;
    this.dname = conf.dname || "(no name)";
    
    this.descr = conf.dname || "(no description)";
    this.school = conf.school || "(no school)";
    
    this.type = conf.type !== undefined ? conf.type : clubtype.stuorg;
    this.state = clubstat.review;
    
    this.logo = conf.logo || null;

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

// public info
Club.prototype.getInfo = function () {
    return {
        cuid: this.cuid,
        type: this.type,
        
        dname: this.dname,
        descr: this.descr,
        school: this.school,
        
        member_count: this.member.fieldCount(),
        
        logo: this.logo,
        
        state: this.state,
    };
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
            else if (this.member[uuid]) {
                if (this.member[uuid].is_admin)
                    return "admin";
                else
                    return "member";
            } else
                return null;
        })()
    }
};

exports.Club = Club;

Club.format = {};
Club.format.info = {
    dname: {
		type: "string", lim: dname => {
			if (!config.lim.club.dname_reg.test(dname))
				throw new err.Exc("$core.illegal($core.word.dname)");
			return dname.replace(/\n/g, "");
		}
	},
    
    descr: util.checkArg.lenlim(config.lim.club.max_descr, "$core.too_long($core.word.descr)"),
	school: util.checkArg.lenlim(config.lim.club.max_detail, "$core.too_long($core.word.school)"),

    type: "int",

    logo: {
		type: "string", lim: chsum => {
			if (!file.isLegalID(chsum))
				throw new err.Exc("$core.illegal($core.word.file_id)");
			return chsum;
		}
	},
};

Club.query = {
    cuid: (cuid, state) => ({ "cuid": cuid, "state": { $gte: state === undefined ? clubstat.operate : state } }),
    member_exist: (cuid, uuid) => ({ "cuid": cuid, ["member." + uuid]: { $exists: true } }),
    apply_exist: (cuid, uuid) => ({ "cuid": cuid, ["apply_member." + uuid]: { $exists: true } }),
    
    check_creator: (cuid, uuid) => ({
        "cuid": cuid,
        "creator": uuid
    }),
    
    check_admin: (cuid, uuid) => ({
        $or: [
            {
                "cuid": cuid,
                "creator": uuid,
            },
            {
                "cuid": cuid,
                ["member." + uuid + ".is_admin"]: true
            }
        ]
    }),
    
    get_review: uuid => ({
        "creator": uuid,
        "state": clubstat.review
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
    }),
    
    keyword: kw => {
        var reg = util.keywordRegExp(kw);
        
        return {
            $or: [
                { "dname": { $regex: reg } },
                { "descr": { $regex: reg } }
            ]
        };
    }
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
    return config.lim.club.dname_reg.test(name);
}

exports.checkClubExist = async (cuid) => {
    var col = await db.col("club");
	
    if (!await col.count(Club.query.cuid(cuid)))
        throw new err.Exc("$core.not_exist($core.word.club)");
};

exports.checkMaxReview = async (uuid) => {
    var col = await db.col("club");
    
    if (!await user.isAdmin(uuid))
        if (await col.count(Club.query.get_review(uuid))
            >= config.lim.club.max_review_count)
            throw new err.Exc("$core.club.max_review_reached");
};

exports.newClub = async (creator, conf) => {
    if (!checkClubName(conf.dname))
        throw new err.Exc("$core.club.illegal_name");
    
    await exports.checkMaxReview(creator);
    
    var col = await db.col("club");
    
    var cuid = await uid.genUID("user"); // cuid == uuid
    var club = new Club(cuid, creator, conf);

    await col.insertOne(club);

    return club;
};

exports.checkCreator = async (cuid, uuid) => {
    var col = await db.col("club");
    
    if (!await user.isAdmin(uuid))
        if (!await col.count(Club.query.check_creator(cuid, uuid)))
            throw new err.Exc("$core.club.not_club_owner");
};

exports.checkAdmin = async (cuid, uuid) => {
    var col = await db.col("club");
    
    if (!await user.isAdmin(uuid))
        if (!await col.count(Club.query.check_admin(cuid, uuid)))
            throw new err.Exc("$core.club.not_club_owner");
};

exports.cuid = async (cuid, state) => {
    var col = await db.col("club");
	var found = await col.findOne(Club.query.cuid(cuid, state));

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

exports.publish = async (cuid, uuid, forced) => {
    var club = await exports.cuid(cuid, clubstat.all);
    
    if (!forced)
        await user.checkAdmin(uuid);
    
    if (club.getState() != clubstat.review)
        throw new err.Exc("$core.club.already_reviewed");
    
    var col = await db.col("club");
    
    await col.updateOne(Club.query.cuid(cuid, clubstat.all), Club.set.publish());
};

exports.delete = async (cuid, uuid) => {
    // only creator can delete an event(under review)
    await exports.checkCreator(cuid, uuid);
    
    var club = await exports.cuid(cuid, clubstat.all);

    if (club.getState() != clubstat.review)
        throw new err.Exc("$core.club.club_not_review");
        
    var col = await db.col("club");
    
    await col.deleteOne(Club.query.cuid(cuid, clubstat.all));
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

exports.search = async (uuid, conf) => {
    var query = { state: clubstat.operate };

    if (conf.kw) query.extend(Club.query.keyword(conf.kw));

    var col = await db.col("club");
    
    var res = await col.find(query)
                       .limit(config.lim.club.max_search_results)
                       .toArray();
                       
    var ret = [];

    res.forEach(clb => ret.push(new Club(clb).getRelatedInfo(uuid)));

    return ret;
};
