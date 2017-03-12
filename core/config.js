"use strict";

module.exports = {
	port: 3138,

	lim: {
		user: {
			dname: 64,
			lname: 128,
			passwd: 16
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
		rsalen: 256,
		cache: 64 // number of cached keys
	}
};
