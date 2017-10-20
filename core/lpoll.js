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

exports.off = (token, cb) => {
	if (cb) {
		if (hups[token]) {
			var i = hups[token].indexOf(cb);
			
			if (i !== -1) {
				hups[token].slice(i, 1);
			}
		} // else nothing to delete
	} else {
		delete hups[token];
	}
	
	// console.log(hups);
};

exports.emit = async (token, res) => {
	if (!hups.hasOwnProperty(token)) return;

	var keep = [];
	var arr = hups[token];

	for (var i = 0; i < arr.length; i++) {
		if (await arr[i](res) === false)
			keep.push(arr[i]);
	}

	hups[token] = keep;
};
