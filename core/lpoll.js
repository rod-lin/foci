/* long poll */

"use strict";

var hups = {};

/*
	cb: function (res) return {
		false => keep
		other => remove
	}
*/
exports.reg = (token, cb) => {
	if (!hups.hasOwnProperty(token))
		hups[token] = [];

	hups[token].push(cb);
};

exports.emit = (token, res) => {
	if (!hups.hasOwnProperty(token)) return;

	var keep = [];
	var arr = hups[token];

	for (var i = 0; i < arr.length; i++) {
		if (arr[i](res) === false)
			keep.push(arr[i]);
	}

	hups[token] = keep;
};
