/* short msg */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var config = require("./config");

var request = require("request");

function initNetease() {
	var appkey = config.smsg.netease.appkey;
	var appsec = config.smsg.netease.appsec;

	function req(url, form, cb) {
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
			}, function (error, res, body) {
				if (error || res.statusCode != 200) {
					rej(new err.Exc("$core.smsg.failed_get"));
				} else {
					cb(suc, rej, JSON.parse(body));
				}
			});
		});
	}

	exports.sendCode = (phone) => {
		return req("https://api.netease.im/sms/sendcode.action", { mobile: phone, codeLen: config.smsg.vercode_len }, function (suc, rej, dat) {
			if (dat.obj) suc();
			else rej(new err.Exc("$core.smsg.failed_send_code"));
		});
	};

	exports.verify = (phone, code) => {
		return req("https://api.netease.im/sms/verifycode.action", { mobile: phone, code: code }, function (suc, rej, dat) {
			if (dat.code == 200) {
				suc();
			} else {
				rej(new err.Exc("$core.smsg.failed_verify"));
			}
		});
	};
}

function initAli() {
	var qs = require("querystring");
	var moment = require("moment");

	var appkey = config.smsg.ali.appkey;
	var appsec = config.smsg.ali.appsec;

	// re-implement ali(the npm package is not working... :-()
	var ali = (function () {
		function alisign(param, sec) {
			var pairs = [];

			for (var k in param) {
				if (param.hasOwnProperty(k))
					pairs.push([ k, param[k] ]);
			}

			// sort by ascii
			pairs.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });

			var acc = "";

			for (var i = 0; i < pairs.length; i++) {
				acc += pairs[i][0] + pairs[i][1];
			}

			// console.log(acc);

			var sign = util.md5(sec + acc + sec, "hex").toUpperCase();

			return sign;
		}

		function aliformat(param, sec) {
			var sign = alisign(param, sec);
			var query = qs.stringify(param.extend({ sign: sign }));
			return "http://gw.api.taobao.com/router/rest?" + query;
		}

		return function (appkey, seckey) {
			return {
				smsSend: function (param) {
					var url = aliformat({
						method: "alibaba.aliqin.fc.sms.num.send",
						app_key: appkey,
						timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
						format: "json",
						v: "2.0",
						sign_method: "md5"
					}.extend(param), seckey);

					// console.log(moment().format("YYYY-MM-DD HH:mm:ss"));
					// console.log(url);
					
					return new Promise(function (suc, rej) {
						request.get(url, function (error, res, body) {
							if (error || res.statusCode != 200) {
								rej(new err.Exc("$core.smsg.failed_get"));
							} else {
								try {
									var res = JSON.parse(body)["alibaba_aliqin_fc_sms_num_send_response"];
									if (!res) {
										console.log(JSON.parse(body));
										rej(new err.Exc("$core.smsg.service_rej"));
									} else {
										suc(res.result);
									}
								} catch (e) {
									rej(new err.Exc("$core.smsg.bad_res_format"));
								}
							}
						});
					});
				}
			};
		}
	})();

	if (!appkey || !appsec) return;

	// var ali = require("alidayu-node-sdk");
	var app = new ali(appkey, appsec);

	function genCode(len) {
		var code = "";
		while (len--) code += Math.floor(Math.random() * 10);
		return code;
	}

	exports.sendCode = async (phone) => {
		var code = genCode(config.smsg.vercode_len);
		var res = await app.smsSend({
			sms_type: "normal",
			sms_free_sign_name: config.smsg.ali.sign,
			sms_param: JSON.stringify({ code: code }),
			rec_num: phone,
			sms_template_code: config.smsg.ali.template.reg_vercode
		});

		var col = await db.col("smsg");

		col.findOneAndUpdate(
			{ phone: phone },
			{ $set: { phone: phone, code: code, stamp: util.stamp() } },
			{ upsert: true }
		);

		if (!res.success) {
			console.log(res);
			throw new err.Exc("$core.smsg.failed_send_code");
		}
	};

	exports.verify = async (phone, code) => {
		var col = await db.col("smsg");

		var ret = (await col.findOneAndDelete({ phone: phone, code: code })).value;

		if (!ret) {
			throw new err.Exc("$core.smsg.failed_verify");
		}

		if (util.stamp() - ret.stamp > config.smsg.timeout) {
			throw new err.Exc("$core.smsg.vercode_timeout");
		}
	};
}

switch (config.smsg.use) {
	case "ali": initAli(); break;
	case "netease": initNetease(); break;
	default: throw "no smsg service selected";
}
