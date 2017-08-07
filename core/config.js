"use strict";

var conf = module.exports = {
	port: 3138,

	ssl: {
		port: 3142,
		enabled: false,
		privkey: "ssl/priv.pem",
		certif: "ssl/cert.crt"
	},

	debug: true,

	file: {
		max_size: 1024 * 1024 * 10,
		// with respect to the root dir of the app
		save_dir: "upload"
	},

	lim: {
		// favtag: [ "art", "academic", "sports", "exam", "music", "developing", "tech" ],
		favtag: {

			"art": {
				name: "art",
				icon: "paint brush"
			},

			"academic": {
				name: "academic",
				icon: "student"
			},

			"sports": {
				name: "sports",
				icon: "flag checkered"
			},

			"exam": {
				name: "exam",
				icon: "book"
			},

			"music": {
				name: "music",
				icon: "music"
			},

			"developing": {
				name: "developing",
				icon: "bug"
			},

			"tech": {
				name: "tech",
				icon: "microchip"
			}
		},

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

			admin_level: -1, // lower the admin_level, higher the ability

			max_login_try: 5,
			account_freeze_time: 1000 * 60 * 60, /* an hour */

			session_timeout: 1000 * 60 * 60 * 48, // 2 days
			max_search_results: 8
		},

		event: {
			title: 256,
			descr: 40960,
			location: 1024,

			keyword: 128,
			rform: 2048,

			max_search_results: 16,

			// max days after the event ended and before auto termination
			// max_term_delay: 1000 * 60 * 60 * 24 * 10, // 10 day
		},

		pm: {
			text: 256
		},

		notice: {
			title: 128,
			text: 2048
		},

		comment: {
			text: 512,
			max_get_length: 8,
			max_comm_per_user: 3
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
			file: "file",
			pm: "pm",
			cover: "cover"
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

	mail: {
		service: "Hotmail",
		email: "",
		passwd: ""
	},

	reg: {
		timeout: 1000 * 120, // 2 min
		vercode_len: 4
	},

	// system sender
	notice: {
		system: {
			// url relative to the front dir
			"helper": { logo: "/img/def/helper.jpg", name: "Foci Helper" }
		}
	},

	alipay: {
		priv: "/home/rodlin/alipaykey/priv.pem",
		pub: "/home/rodlin/alipaykey/pub.pem",

		sign_type: [ "RSA-SHA256", "RSA2" ]
	}
};

conf.db.col.smsg = "smsg-" + conf.smsg.use;

var fs = require("fs");

if (!fs.existsSync(conf.file.save_dir)) {
	fs.mkdirSync(conf.file.save_dir);
}
