/* foci forum */

"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var util = require("./util");
var club = require("./club");
var user = require("./user");
var config = require("./config");

// must has: creator
var PostComment = function (creator, conf) {
    if (arguments.length == 1) {
        this.extend(arguments[0]);
        return;
    }
    
    this.creator = creator;
    this.ctime = conf.ctime || new Date();
    this.etime = this.ctime; // edited time
    this.type = conf.type || "normal";
    this.format = conf.format || "html";
    this.msg = conf.msg || "(empty message)";
};

// must has: cuid, puid, creator
var PostObject = function (cuid, puid, creator, conf) {
    if (arguments.length == 1) {
        this.extend(arguments[0]);
        return;
    }
    
    this.cuid = cuid;
    this.puid = puid;
    
    this.creator = creator;
    this.ctime = conf.ctime || new Date();
    this.utime = this.ctime; // updated time
    
    this.tags = conf.tags || [];
    
    // participated user
    this.partic = [ creator ];
    
    this.visible_to = conf.visible_to || []; // visible only to users with these titles
    
    this.title = conf.title || "(no title)";
    
    this.type = conf.type || "post";
    this.pinned = 0; // always on the top
    
    this.comments = [ new PostComment(creator, conf.init) ];
};

exports.PostComment = PostComment;

PostComment.format = {};

PostComment.format.comment = {
    msg: util.checkArg.lenlim(config.lim.forumi.max_comment, "$core.too_long($core.word.comment)"),
    format: util.checkArg.inarr([ "html" ])
};

exports.PostObject = PostObject;

PostObject.prototype = {};

PostObject.prototype.getPreview = function () {
    return {
        puid: this.puid,
        creator: this.creator,
        
        ctime: this.ctime,
        utime: this.utime,
        
        tags: this.tags,
        visible_to: this.visible_to,
        
        title: this.title,
        
        type: this.type,
        pinned: this.pinned,
        
        comment_count: this.comments.length,
        partic_count: this.partic.length
    };
};

PostObject.format = {};

PostObject.format.newpost = {
    title: util.checkArg.lenlim(config.lim.forumi.max_post_title, "$core.too_long($core.word.title)"),
    
    tags: "array",
    visible_to: "array",
    pinned: "bool",
    
    init: util.checkArg.nested(PostComment.format.comment, true)
};

PostObject.query = {
    puid: (puid, cuid) => {
        var q = { "puid": puid };
        
        if (cuid !== undefined)
            q.cuid = cuid;
        
        return q;
    },
    
    comment_only: (skip, limit) => ({
        "comments": { $slice: [ skip, limit ] }
    }),
    
    visible_only: () => ({
        "visible_to": 1
    }),
    
    check_all_visible: (puid, uuid) => ({
        puid: puid,
        $or: [
            { creator: uuid }, // the creator can always view the post
            { visible_to: [] } // visibility not set
        ]
    }),
    
    check_editable: (puid, comment, uuid) => ({
        puid: puid,
        ["comments." + comment + ".creator"]: uuid
    }),
    
    all_post: (cuid, title) => ({
        cuid: cuid,
        $or: [
            { visible_to: [] },
            { visible_to: title }
        ]
    })
};

PostObject.set = {
    push_comment: comm => ({
        $push: {
            "comments": comm
        },
        
        $set: {
            utime: new Date()
        },
        
        $addToSet: {
            partic: comm.creator
        }
    }),
    
    edit_comment: (comment, conf) => {
        var q = {};
        
        for (var k in conf) {
            if (conf.hasOwnProperty(k)) {
                q["comments." + comment + "." + k] = conf[k];
            }
        }
        
        return { $set: q };
    },
    
    pinned: (pinned) => ({
        $set: {
            pinned: !!pinned + 0
        }
    })
};

exports.checkPostExist = async (puid, cuid) => {
    var col = await db.col("fpost");
    
    if (await col.count(PostObject.query.puid(puid, cuid)) == 0)
        throw new err.Exc("$core.forumi.post_not_exist");
};

exports.checkVisible = async (puid, cuid, uuid) => {
    var col = await db.col("fpost");
    
    await exports.checkPostExist(puid, cuid);
    
    if (await col.count(PostObject.query.check_all_visible(puid, uuid)) == 0) {
        // visibility set
        var res = await col.findOne(PostObject.query.puid(puid),
                                    PostObject.query.visible_only());
        
        await club.checkTitle(cuid, uuid, res.visible_to);
    }
};

// check accessbility of a user to a post
exports.checkPostAccess = async (cuid, puid, uuid) => {
    await exports.checkPostExist(puid, cuid);
    
    if (!await user.isAdmin(uuid)) {
        await club.checkMemberExist(cuid, uuid, true);
        await exports.checkVisible(puid, cuid, uuid);
    }
};

// check accessbility of a user to a club forum
exports.checkAccess = async (cuid, uuid) => {
    if (!await user.isAdmin(uuid)) {
        await club.checkMemberExist(cuid, uuid, true);
    }
};

exports.checkEditable = async (puid, comment, uuid) => {
    if (!await user.isAdmin(uuid)) {
        var col = await db.col("fpost");
        
        console.log(PostObject.query.check_editable(puid, comment, uuid));
        if (await col.count(PostObject.query.check_editable(puid, comment, uuid)) == 0)
            throw new err.Exc("$core.forumi.comment_not_editable");
    }
};

exports.puid = async (puid) => {
    await exports.checkPostExist(puid);
    
    var col = await db.col("fpost");
    
    return new PostObject(await col.findOne(PostObject.query.puid(puid)));
};

// newPost
exports.newPost = async (cuid, creator, conf) => {
    await club.checkClubExist(cuid);
    await club.checkMemberExist(cuid, creator, true);
    
    var puid = await uid.genUID("puid");
    var post = new PostObject(cuid, puid, creator, conf);

    var col = await db.col("fpost");
    
    await col.insertOne(post);
    
    return post;
};

// newComment
exports.newComment = async (cuid, puid, creator, conf) => {
    await exports.checkPostAccess(cuid, puid, creator);

    var comment = new PostComment(creator, conf);
    var col = await db.col("fpost");
    
    await col.updateOne(PostObject.query.puid(puid, cuid),
                        PostObject.set.push_comment(comment));
                        
    return comment;
};

exports.getPostComment = async (cuid, puid, uuid, conf) => {
    await exports.checkPostAccess(cuid, puid, uuid);
    
    conf = conf || {};
    conf.skip = conf.skip || 0;
    conf.limit = config.lim.forumi.max_comment_limit;
    
    var col = await db.col("fpost");
    
    var res = await col.findOne(PostObject.query.puid(puid, cuid),
                                PostObject.query.comment_only(conf.skip, conf.limit));
    
    return res.comments;    
};

exports.getPost = async (cuid, uuid, conf) => {
    await exports.checkAccess(cuid, uuid);
    
    conf = conf || {};
    conf.skip = conf.skip || 0;
    conf.limit = config.lim.forumi.max_post_limit;
    
    var col = await db.col("fpost");
    
    var title = await club.getTitle(cuid, uuid);
    
    // console.log(PostObject.query.all_post(cuid, title), conf.skip, conf.limit);
    
    var res = await col.find(PostObject.query.all_post(cuid, title))
                       .sort({ pinned: -1, utime: -1, ctime: -1 })
                       .skip(conf.skip)
                       .limit(conf.limit).toArray();
                       
    var ret = [];
                       
    res.forEach(post => ret.push(new PostObject(post).getPreview()));
    
    return ret;
};

exports.getOnePost = async (cuid, puid, uuid) => {
    await exports.checkAccess(cuid, uuid);
    await exports.checkVisible(puid, cuid, uuid);

    return (await exports.puid(puid)).getPreview();
};

exports.editComment = async (cuid, puid, comment, uuid, conf) => {
    await exports.checkAccess(cuid, uuid);
    await exports.checkEditable(puid, comment, uuid);
    
    var col = await db.col("fpost");
    
    await col.updateOne(PostObject.query.puid(puid, cuid),
                        PostObject.set.edit_comment(comment, conf));
};

exports.pinPost = async (cuid, puid, uuid, pinned) => {
    await club.checkAdmin(cuid, uuid);
    
    var col = await db.col("fpost");
    
    await col.updateOne(PostObject.query.puid(puid, cuid),
                        PostObject.set.pinned(pinned));
};

// setTag
// setTitle
// setVisibleTo
