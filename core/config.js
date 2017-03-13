"use strict";

module.exports = {
	port: 3138,

	lim: {
		user: {
			dname: 64,
			lname: 128,
			passwd: 16,

			session_timeout: 1000 * 60 * 12 // 12 min
		}
	},

	db: {
		url: "127.0.0.1",
		port: 3137,
		name: "foci-main",
		opt: { auto_reconnect: true },
		col: {
			user: "user",
			activ: "activ",
			uid: "uid"
		}
	},

	auth: {
		rsalen: 512,
		cache: 16, // number of cached keys
		head_timeout: 1000 * 60 // 1 min, header timeout
	}
};
