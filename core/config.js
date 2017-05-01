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
		favtag: [ "art", "academic", "sports", "exam", "music", "developing", "" ],

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

			session_timeout: 1000 * 60 * 12 // 12 min
		},

		event: {
			title: 256,
			descr: 40960,
			location: 1024,

			keyword: 128
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
			location: "(unsettled)"
		}
	}
};

var fs = require("fs");

if (!fs.existsSync(conf.file.save_dir)) {
	fs.mkdirSync(conf.file.save_dir);
}
