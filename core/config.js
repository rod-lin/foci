"use strict";

module.exports = {
	port: 3138,

	lim: {
		favtag: [ "tech", "music", "travel" ],

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
			uid: "uid"
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
