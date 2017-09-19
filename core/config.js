"use strict";

var conf = module.exports = {
	port: 3138,

	ssl: {
		port: 3142,
		enabled: false,
		privkey: "ssl/priv.pem",
		certif: "ssl/cert.crt"
	},

	debug: false,

	file: {
		max_size: 1024 * 1024 * 10,
		// with respect to the root dir of the app
		save_dir: "upload",
		allowed_ct: [
			"image/gif",
			
			"image/jpeg",
			"image/pjpeg",
			
			"image/x-icon",

			"image/png",
			"image/x-png",

			"image/tiff",
			
			"image/bmp",
			"application/x-bmp",
		]
	},

	lim: {
		// favtag: [ "art", "academic", "sports", "exam", "music", "developing", "tech" ],
		favtag: {

			"art": {
				name: "art",
				icon: "paint brush"
			},
			
			"workshop": {
				name: "workshop",
				icon: "idea"
			},
			
			"volunteer": {
				name: "volunteer",
				icon: "handshake"
			},
			
			"language": {
				name: "language",
				icon: "talk"
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

			"tech": {
				name: "tech",
				icon: "rocket"
			}
		},
		
		favtag_count: undefined,

		user: {
			dname: 64,
			lname: 128,
			passwd: 16,

			intro: 2048,
			school: 128,

			level: {
				"-1": {
					event_interval: 0,
				},
				
				// level 0 - basic user
				"0": {
					// event lock interval
					event_interval: 1000 * 60 * 60 * 24 * 7, // 7 days
				}
			},

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

			auto_clean: true, // auto clean all empty drafts
			auto_clean_interval: 1000 * 60 * 60 * 24 * 2, // 2 days

			max_safe_draft_num: 5, // after this a captcha will be triggered every time
			max_draft_num: 16, // no more new draft event after 16

			// max days after the event ended and before auto termination
			// max_term_delay: 1000 * 60 * 60 * 24 * 10, // 10 day
		},
		
		club: {
			max_name_len: 64
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
		},
		
		// traffic control
		traffic: {
			default_level: "normal",
			
			levels: {
				"normal": {
					// max times to use a single interface during gc's for one ip
					max_count_per_int_per_ip_per_gc: 512,
					
					// number of ip to trigger collection
					gc_threshold: 1000,
					
					// cleaning threshold of an ip log
					gc_time_threshold: 1000 * 60 * 30, // half an hour
				}
			}
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
		service: "QQex",
		email: "helper@foci.me",
		passwd_enc: true,
		passwd: "U2FsdGVkX1+5WKK5xcMya2zJvSPDnFOWn+YOW6Qwn+0="
	},

	reg: {
		timeout: 1000 * 120, // 2 min
		vercode_len: 4
	},

	// system sender
	notice: {
		system: {
			// url relative to the front dir
			"helper": { logo: "/img/def/helper.jpg", name: "Foci Helper" },
			"review": { logo: "/img/def/review.jpg", name: "Foci Event Review" },
		}
	},

	alipay: {
		priv: "/home/rodlin/alipaykey/priv.pem",
		pub: "/home/rodlin/alipaykey/pub.pem",

		sign_type: [ "RSA-SHA256", "RSA2" ]
	},
	
	oss: {
		type: "ali",
		region: "oss-cn-hangzhou",
		enc: true,
		acckey: "U2FsdGVkX19UXegeWLnG6lSTQ+O2N7JuDoYBx9CEfHLwqGMT6p0Rbef4uU2mVba5",
		seckey: "U2FsdGVkX19L2W2PLjOYnQVONfvJEl1y6l4srETP9G+0IBZ7qMx+LLsEPjyWS2CE",
		bucket: "foci-upload-0"
	},
	
	captcha: {
		type: "geetest",
		enc: true,
		id: "U2FsdGVkX1++TSCmL3g+iT+YAU45KZOmYZSmwOPKKu9wKCtEvTCMGGnl3lf6e8J4xe67FIkNS7xpS5TLMNFOzw==",
		key: "U2FsdGVkX1+dfM76P0oaqjPhjtvUQCwRYoyOl9bmhxJzBem8mX4qn3agqRAC8EvPAQjQk7vm4uZEFb/xf5VaSQ=="
	}
};

conf.db.col.smsg = "smsg-" + conf.smsg.use;

var fs = require("fs");

if (!fs.existsSync(conf.file.save_dir)) {
	fs.mkdirSync(conf.file.save_dir);
}

conf.lim.favtag_count = Object.keys(conf.lim.favtag).length;

if (fs.existsSync("config.site.js")) {
	var ext = require("../config.site.js");
	conf.pass = ext.pass;
}
