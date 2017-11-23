
"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var auth = require("./auth");
var config = require("./config");

var geetest = require("gt3-sdk");

var cap;

if (config.captcha && config.captcha.type == "geetest") {
    if (config.captcha.enc) {
        var key = util.getPass();
		
		config.captcha.id = auth.aes.dec(config.captcha.id, key);
		config.captcha.key = auth.aes.dec(config.captcha.key, key);
		
		if (!config.captcha.id || !config.captcha.key) {
			util.log("captcha: incorrect password", util.style.red("ERROR"));
			process.exit();
		}
    }
    
    cap = new geetest({
        geetest_id: config.captcha.id,
        geetest_key: config.captcha.key
    });
}

// call this first
exports.register = async (ip) => {
    var dat = await cap.register({
        ip_address: ip
    });

    return {
        gt: config.captcha.id,
        challenge: dat.challenge,
        offline: !dat.success
    };
};

/*
    ans {
        challenge,
        validate,
        seccode
    }
 */
exports.verify = async (ans) => {
    if (config.no_cap)
        return true;

    return await cap.validate(!!ans.offline, {
        challenge: ans.challenge,
        validate: ans.validate,
        seccode: ans.seccode
    });
};

// returns: -1 for no captcha but good, 0 for not good, 1 for has captcha
exports.check = async (env, check_fn, ans) => {
    if (config.no_cap) {
        return 1;
    }

    if (ans) {
        if (!await exports.verify(ans)) {
            throw new err.Exc("$core.cap_verification_failed");
        }
        
        return 1;
    } else if (!check_fn()) {
        // need cap
        util.log("request captcha to " + env.ip(), util.style.yellow("CAPTCHA"));
        var challenge = await exports.register(env.ip());
        
        if (challenge === null) {
            return -1; // geetest is down...
        }
        
        if (config.offline)
            return -1;
        
        await env.qcap(challenge);
        
        return 0;
    }
    
    return -1;
};
