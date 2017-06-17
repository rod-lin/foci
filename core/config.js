"use strict";

var conf = module.exports = {
	port: 3138,

	debug: true,

	file: {
		max_size: 1024 * 1024 * 10,
		// with respect to the root dir of the app
		save_dir: "upload"
	},

	lim: {
		favtag: [ "art", "academic", "sports", "exam", "music", "developing", "tech" ],

		user: {
			dname: 64,
			lname: 128,
			passwd: 16,

			intro: 2048,
			school: 128,

			level: [
				// level 0 - basic user
				{
					// event lock interval
					event_interval: 1000 * 60 * 60 * 24 * 7, // 7 days
				}
			],

			session_timeout: 1000 * 60 * 60, // 60 min
			max_search_results: 16
		},

		event: {
			title: 256,
			descr: 40960,
			location: 1024,

			keyword: 128,
			rform: 2048,

			max_search_results: 16
		},

		pm: {
			text: 256
		}
	},

	db: {
		url: "127.0.0.1",
		port: 3137,
		name: "foci-main",
		opt: { auto_reconnect: true },
		col: {
			user: "user",
			event: "event",
			uid: "uid",
			file: "file"
		}
	},

	auth: {
		rsalen: 512,
		cache: 16, // number of cached keys
		head_timeout: 1000 * 60 // 1 min, header timeout
	},

	// default
	def: {
		event: {
			title: "(untitled)",
			loclng: 120.159236,
			loclat: 30.273407
		}
	},

	smsg: {
		vercode_len: 4,
		timeout: 1000 * 120, // 2 mi

		use: "ali", // ali or netease
		ali: {
			appkey: "23885780",
			appsec: "762b4711cadae2b72826f039add11197",
			sign: "Foci活动管家",
			template: {
				reg_vercode: "SMS_69550019",
			}
		},

		netease: {
			appkey: "",
			appsec: ""
		}
	},

	// system sender
	notice: {
		system: {
			// url relative to the front dir
			"helper": { logo: "/img/def/helper.jpg", name: "Foci Helper" }
		}
	}
};

conf.db.col.smsg = "smsg-" + conf.smsg.use;

var fs = require("fs");

if (!fs.existsSync(conf.file.save_dir)) {
	fs.mkdirSync(conf.file.save_dir);
}
