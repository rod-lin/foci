"use strict";

module.exports = {
	lim: {
		user: {
			dname: 64,
			lname: 128,
			passwd: 16
		}
	},

	db: {
		url: "localhost",
		port: 3137,
		name: "foci-main",
		opt: { auto_reconnect: true },
		col: {
			user: "user",
			activ: "activ"
		}
	}
};
