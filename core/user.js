"use strict";

var db = require("./db");
var err = require("./err");
var uid = require("./uid");
var auth = require("./auth");
var util = require("./util");
var event = require("./event");
var config = require("./config");
var invcode = require("./invcode");

var User = function (uuid, dname, lname, passwd) {
	if (arguments.length == 1) {
        this.extend(arguments[0]); // called with only one argument
        return;
    }

	// err.assert(typeof uuid === "number" && uuid > 0, "illegal uuid");
	// err.assert(typeof dname === "string" && dname.length <= config.lim.user.dname,
	// 		   "illegal display name");
	// err.assert(typeof lname === "string" && lname.length <= config.lim.user.lname,
	// 		   "illegal login name");
	// err.assert(typeof passwd === "string" && passwd.length == config.lim.user.passwd,
	//		   "illegal password checksum");

	this.uuid = uuid;
	this.level = 0;

	this.avatar = null;

	this.dname = dname;
	this.lname = lname;
	this.passwd = passwd;
	this.favtag = [];

	this.resume = null; // cache of resume

	this.age = NaN;
	this.intro = "";
	this.school = "";

	this.notice = {};

	// this.rating = {
	// 	tot: [ 0, 0 ],
	// 	log: []
	// };
	
	// this.staff_rating = null; // should be []
	// [ { euid, rating } ]
	this.staff_rating = {};
	
	// rating = (event_tot * 1.1 + staff_tot) / total_job

	this.club = null;

	this.apply_update = 0;
	this.notice_update = 0;

	this.pm = {};

	this.login_fail_last = null;
	this.login_fail_count = 0;
	
	this.realname = null; // { name, school, grade }
	this.realname_review = null; // { name, school, grade, invcode }
};

exports.User = User;
User.prototype = {};
User.prototype.getUUID = function () { return this.uuid; };
User.prototype.getDName = function () { return this.dname; };
User.prototype.getLName = function () { return this.lname; };
// User.prototype.getInfo = function () { return this.info; };
User.prototype.getTag = function () { return this.favtag; };
User.prototype.getLevel = function () { return this.level; };
User.prototype.getAppUpdate = function () { return this.apply_update ? this.apply_update : 0 };

// this will be sent to the client
User.prototype.getInfo = function () {
	return {
		uuid: this.uuid,

		dname: this.dname,
		level: this.level,
		favtag: this.favtag,
		// rating: this.rating.tot,

		club: this.club,

		avatar: this.avatar,

		age: this.age,
		intro: this.intro,
		school: this.school,
		
		realname: !!this.realname,
		realname_review: !!this.realname_review
	};
};

User.prototype.getResume = function () {
	return this.resume;
};

User.prototype.getStaffTotalRating = function () {
	var tot = 0;
	var len = 0;
	
	// console.log(this.uuid + ": ", this.staff_rating);
	
	if (this.staff_rating) {
		for (var euid in this.staff_rating) {
			if (this.staff_rating.hasOwnProperty(euid)) {
				len++;
				tot += this.staff_rating[euid].rating;
			}
		}
	}

	return [ len, tot ];
};

User.prototype.getRealname = function () {
	return this.realname ? this.realname : null;
};

User.format = {};

User.format.info = {
	dname: util.checkArg.lenlim(config.lim.user.dname, "$core.too_long($core.word.dname)"),
	favtag: { type: "json", lim: tags => exports.checkTag(tags) },

	age: {
		type: "int", lim: age => {
			if (age < 0 || age > 120)
				throw new err.Exc("$core.illegal($core.word.age)");
			return age;
		}
	},

	avatar: {
		type: "string", lim: chsum => {
			if (!chsum.length > 32)
				throw new err.Exc("$core.illegal($core.word.file_id)");
			return chsum;
		}
	},

	intro: util.checkArg.lenlim(config.lim.user.intro, "$core.too_long($core.word.intro)"),
	school: util.checkArg.lenlim(config.lim.user.school, "$core.too_long($core.word.school)")
};

User.query = {
	uuid: uuid => ({ "uuid": uuid }),
	lname: lname => ({ "lname": lname }),
	sid: sid => ({ "sid": sid }),

	pass: (lname, passwd) => ({ "lname": lname, "passwd": util.md5(passwd) }),

	// fuzzy search(all)
	fuzzy: kw => {
		var reg = util.keywordRegExp(kw);
		return {
			$or: [
				{ "dname": { $regex: reg } },
				{ "lname": { $regex: reg } }
			]
		};
	},

	// search tag(fuzzy)
	ftag: tag => {
		var reg = new RegExp(tag, "i");
		return { "favtag": { $regex: reg } };
	},

	tag: tag => ({ "favtag": tag }),

	check_level: (uuid, level) => ({ "uuid": uuid, "level": level }),
	check_admin: (uuid, level) => ({ "uuid": uuid, "level": { $lte: level } }),

	// too many failed login tries
	check_exceed_try: lname => ({
		"lname": lname,
		"login_fail_count": { $gt: config.lim.user.max_login_try },
		"login_fail_last": { $gt: new Date(new Date() - config.lim.user.account_freeze_time) }
	}),
	
	check_staff_rated: (uuid, euid) => ({
		"uuid": uuid,
		["staff_rating." + euid]: { $exists: true }
	}),
	
	check_realname: uuid => ({
		"uuid": uuid,
		"realname": { $ne: null }
	})
};

User.set = {
	session: (sid, stamp) => ({ $set: { "sid": sid, "stamp": stamp } }),
	rmsession: () => ({ $unset: { "sid": "", "stamp": "" } }),

	passwd: passwd => ({ $set: { "passwd": util.md5(passwd) } }),

	info: info => ({ $set: info }),

	tag: tag => ({ $set: { "favtag": tag } }),

	resume: resume => ({ $set: { "resume": resume } }),

	inc_app: () => ({ $inc: { "apply_update": 1 } }),
	clear_app: () => ({ $set: { "apply_update": 0 } }),

	inc_login_fail: () => ({
		$inc: { "login_fail_count": 1 },
		$set: { "login_fail_last": new Date() }
	}),

	reset_login_fail: () => ({
		$set: {
			"login_fail_count": 0,
			"login_fail_last": new Date(0)
		}
	}),
	
	set_staff_rating: (euid, rating) => ({
		$set: {
			["staff_rating." + euid]: {
				rating: rating
			}
		}
	}),
	
	set_realname: dat => ({
		$set: { realname: dat }
	})
};

var genSessionID = (lname) => util.md5(util.salt(), "hex");

exports.uuid = async (uuid) => {
	var col = await db.col("user");
	var found = await col.findOne(User.query.uuid(uuid));

	if (!found)
		throw new err.Exc("$core.not_exist($core.word.user)");

	return new User(found);
};

exports.checkUUID = async (uuid) => {
	var col = await db.col("user");
	var found = await col.findOne(User.query.uuid(uuid));

	if (!found)
		throw new err.Exc("$core.not_exist($core.word.user)");
};

exports.checkUUIDs = async (uuids) => {
	for (var i = 0; i < uuids.length; i++) {
		await exports.checkUUID(uuids[i]);
	}
};

exports.hasLName = async (lname) => {
	var col = await db.col("user");
	return await col.find(User.query.lname(lname)).count() > 0;
};

exports.checkLevel = async (uuid, level) => {
	var col = await db.col("user");
	var found = await col.findOne(User.query.check_level(uuid, level));

	if (!found)
		throw new err.Exc("$core.permission_denied");
};

exports.isAdmin = async (uuid) => {
	var col = await db.col("user");
	var found = await col.findOne(User.query.check_level(uuid, config.lim.user.admin_level));
	return !!found;
};

exports.checkAdmin = async (uuid) => {
	if (!await exports.isAdmin(uuid))
		throw new err.Exc("$core.permission_denied");
};

var testUserName = (name) => {
	return /^[0-9a-zA-Z_\-@.]+$/g.test(name);
};

exports.checkNewUserName = async (lname) => {
	var col = await db.col("user");

	if (!testUserName(lname))
		throw new err.Exc("$core.invalid_user_name");

	var found = !!await col.findOne(User.query.lname(lname));

	if (found)
		throw new err.Exc("$core.dup_user_name");
};

exports.checkUserExist = async (lname) => {
	var col = await db.col("user");

	if (!testUserName(lname))
		throw new err.Exc("$core.invalid_user_name");
		
	var found = await col.findOne(User.query.lname(lname));
	
	if (!found)
		throw new err.Exc("$core.not_exist($core.word.user)");
};

// passwd is clear text
exports.newUser = async (dname, lname, passwd) => {
	var col = await db.col("user");

	await exports.checkNewUserName(lname);

	var uuid = await uid.genUID("uuid");
	var passwd = util.md5(passwd);
	var user = new User(uuid, dname, lname, passwd);

	// err.assert(user instanceof User, "not user type");

	await col.insertOne(user);

	return user;
};

exports.resetPass = async (lname, passwd) => {
	var col = await db.col("user");
	
	await exports.checkUserExist(lname);
	
	await col.updateOne(User.query.lname(lname), User.set.passwd(passwd));
};

// passwd is clear text
exports.checkPass = async (lname, passwd) => {
	var col = await db.col("user");

	if (await col.find(User.query.check_exceed_try(lname)).count()) {
		throw new err.Exc("$core.account_frozen");
	}

	var found = await col.findOne(User.query.pass(lname, passwd));

	if (!found) {
		// TODO: inc fail count
		if (await exports.hasLName(lname)) {
			await col.updateOne(User.query.lname(lname),
								User.set.inc_login_fail());
		}

		throw new err.Exc("$core.wrong_user_passwd");
	} else {
		await col.updateOne(User.query.lname(lname),
							User.set.reset_login_fail());
	}

	return new User(found).getUUID();
};

exports.login = async (lname, passwd) => {
	var uuid = await exports.checkPass(lname, passwd);
	var stamp = util.stamp();
	var sid = genSessionID(lname);

	var col = await db.col("user");

	await col.updateOne(User.query.uuid(uuid), User.set.session(sid, stamp));

	return {
		uuid: uuid,
		sid: sid
	};
};

exports.logout = async (uuid) => {
	var col = await db.col("user");
	await col.updateOne(User.query.uuid(uuid), User.set.rmsession());
	return;
};

exports.getSession = async (lname) => {
	var col = await db.col("user");
	var res = await col.findOne(User.query.lname(lname));

	if (!res)
		throw new err.Exc("$core.not_exist($core.word.user)");

	return res.sid;
};


// enc: encrypted msg(using session id), return { msg, user }
exports.checkSession = async (uuid, enc) => {
	var col = await db.col("user");
	var res = await col.findOne(User.query.uuid(uuid));
	var now = util.stamp();

	if (!res || !res.sid)
		throw new err.Exc("$core.illegal_session");

	if (now - res.stamp > config.lim.user.session_timeout) {
		await col.updateOne(User.query.uuid(uuid), User.set.rmsession());
		throw new err.Exc("$core.session_timeout");
	}

	var msg = auth.aes.dec(enc, res.sid);

	if (!msg)
		throw new err.Exc("$core.illegal_session");

	return {
		msg: msg,
		usr: new User(res),
		sid: res.sid
	};
};

exports.setInfo = async (uuid, info) => {
	var col = await db.col("user");
	await col.updateOne(User.query.uuid(uuid), User.set.info(info));
};

exports.checkTag = (tags) => {
	var ntags = [];
	tags = new Set(tags);

	tags.forEach((tag) => {
		if (!config.lim.favtag.hasOwnProperty(tag)) {
			throw new err.Exc("$core.not_exist($core.word.tag)");
		}

		ntags.push(tag);
	});

	return ntags;
};

exports.search = async (kw) => {
	var col = await db.col("user");
	var res = await col.find(User.query.fuzzy(kw)).limit(config.lim.user.max_search_results).toArray();

	for (var i = 0; i < res.length; i++) {
		res[i] = new User(res[i]).getInfo();
	}

	return res;
};

exports.updateResume = async (uuid) => {
	var col = await db.col("user");
	var nresume = await event.genResume(uuid);

	await col.updateOne(User.query.uuid(uuid), User.set.resume(nresume));
};

exports.getResumeCache = async (uuid) => {
	var user = await exports.uuid(uuid);
	var resume = user.getResume();

	if (!resume) {
		await exports.updateResume(uuid);
		resume = (await exports.uuid(uuid)).getResume();
	}

	return resume ? resume : [];
};

exports.getAppUpdate = async (uuid) => {
	var user = await exports.uuid(uuid);
	return user.getAppUpdate();
};

exports.incAppUpdate = async (uuid) => {
	var col = await db.col("user");
	await col.updateOne(User.query.uuid(uuid), User.set.inc_app(), { upsert: true });
};

exports.clearAppUpdate = async (uuid) => {
	var col = await db.col("user");
	await col.updateOne(User.query.uuid(uuid), User.set.clear_app());
};

exports.calRating = async (uuid) => {
	// rating = (event_tot * 1.1 + staff_tot) / total_job
	var user = await exports.uuid(uuid);
	var event_tot = await event.getOrgRating(uuid);
	var staff_tot = user.getStaffTotalRating();
	
	var tot_job = event_tot[0] + staff_tot[0];
	
	if (!tot_job) return 0;
	
	var rat = (event_tot[1] * 1.05 + staff_tot[1]) / tot_job

	return rat > 10 ? 10 : rat;
};

exports.checkStaffUnrated = async (uuid, euid) => {
	var col = await db.col("user");
	var found = await col.find(User.query.check_staff_rated(uuid, euid)).count();
	
	if (found != 0)
		throw new err.Exc("$core.staff_already_rated");
};

exports.rateStaff = async (euid, self, uuids, rating) => {
	var col = await db.col("user");
	
	await event.checkOwner(euid, self);
	
	for (var i = 0; i < uuids.length; i++) {
		await event.checkStaff(euid, uuids[i]);
		// TODO: allow re-rating
		// await exports.checkStaffUnrated(uuids[i], euid);
	}
	
	// all check done
	
	for (var i = 0; i < uuids.length; i++) {
		await col.updateOne(User.query.uuid(uuids[i]), User.set.set_staff_rating(euid, rating));
		await event.setAppRating(euid, uuids[i], "staff", { rating: rating });
	}
};

exports.checkRealname = async (uuid, dat) => {
	var col = await db.col("user");

	if (!dat.name || !config.lim.realname.name_reg.test(dat.name) ||
		!dat.school || !config.lim.realname.school_reg.test(dat.school) ||
		!dat.grade || dat.grade <= 0 || dat.grade > config.lim.realname.max_grade)
		throw new err.Exc("$core.realname.invalid_check_data");
		
	if (dat.invcode) {
		var invdat = await invcode.findInvcode("realname", dat.invcode);
		
		if (!invdat || (invdat.name && invdat.name != dat.name))
			throw new err.Exc("$core.invalid_invcode");
			
		// good invitation
		
		await col.updateOne(User.query.uuid(uuid), User.set.set_realname({
			name: dat.name,
			school: dat.school,
			grade: dat.grade,
			time: new Date()
		}));
		
		await invcode.invalidate("realname", dat.invcode);
		
		return true;
	} else {
		throw new err.Exc("an invitation code is required for now");
		
		/*
			await col.updateOne(User.query.uuid(uuid), User.set.set_realname_review({
				name: dat.realname,
				school: dat.school,
				grade: dat.grade
			}));
		*/
	}
	
	return false;	
};

exports.isRealname = async (uuid) => {
	var col = await db.col("user");
	return await col.count(User.query.check_realname(uuid)) != 0;
};

exports.resetRealname = async (uuid) => {
	var col = await db.col("user");
	await col.updateOne(User.query.uuid(uuid), User.set.set_realname(null));
};
