/* alipay api */

"use strict";

var config = require("./config");

var fs = require("fs");
var crypto = require("crypto");

function sortParam(param, encode) {
	var arr = [];

	for (var key in param) {
		if (param.hasOwnProperty(key) && key != "sign") {
			arr.push([ key, encode ? encodeURIComponent(param[key]) : param[key] ]);
		}
	}

	arr.push([ "sign_type", config.alipay.sign_type[1] ]);

	arr.sort();
	var qstr = "";
	var pair;

	for (var i = 0; i < arr.length; i++) {
		pair = arr[i];

		if (i) {
			qstr += "&" + pair[0] + "=" + pair[1];
		} else {
			qstr += pair[0] + "=" + pair[1];
		}
	}

	return qstr;
}

var privkey = fs.readFileSync(config.alipay.priv).toString();

function signQuery(query) {
	var sign = crypto.createSign(config.alipay.sign_type[0]);
	
	console.log(query);

	sign.update(query);
	sign = sign.sign(privkey, "base64");

	console.log(sign);

	return sign;
}

exports.genQuery = (param) => {
	var qstr = sortParam(param, true);
	var sign = encodeURIComponent(signQuery(sortParam(param)));
	var final = qstr + "&sign=" + sign;

	return final;
};
