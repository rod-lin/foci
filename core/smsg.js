/* short msg */

"use strict";

var err = require("./err");
var util = require("./util");
var config = require("./config");

var request = require("request");

function req(url, form, cb) {
	var appkey = config.smsg.appkey;
	var appsec = config.smsg.appsec;
	var nonce = util.salt();
	var cur = util.stamp("unix");

	return new Promise((suc, rej) => {
		if (!appkey || !appsec) {
			rej(new err.Exc("$core.smsg.no_appkey"));
			return;
		}

		request.post({
			url: url,
			headers: {
				AppKey: appkey,
				Nonce: nonce,
				CurTime: cur,
				CheckSum: util.sha1(appsec + nonce + cur, "hex"),
				"Content-Type": "application/x-www-form-urlencode"
			},
			form: form
		}, function (err, res, body) {
			if (err || res.statusCode != 200) {
				rej(new err.Exc("$core.smsg.failed_post"));
			} else {
				cb(suc, rej, JSON.parse(body));
			}
		});
	});
}

exports.sendCode = (phone, config) => {
	return req("https://api.netease.im/sms/sendcode.action", { mobile: phone }.extend(config), function (suc, rej, dat) {
		if (dat.obj) suc(dat.obj);
		else rej(new err.Exc("$core.smsg.failed_send_code"));
	});
};

exports.verify = (phone, code) => {
	return req("https://api.netease.im/sms/verifycode.action", { mobile: phone, code: code }, function (suc, rej, dat) {
		suc(dat.code == 200);
	});
};
