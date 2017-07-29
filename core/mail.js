/* email */

"use strict";

var err = require("./err");
var reg = require("./reg");
var util = require("./util");
var config = require("./config");

var nodemailer = require("nodemailer");
var smtp = require("nodemailer-smtp-transport");

var transport = nodemailer.createTransport(smtp({
    service: config.mail.service,
    auth: {
        user: config.mail.email,
        pass: config.mail.passwd
    }
}));

exports.send = (to, subject, cont) => {
    return new Promise((suc, rej) => {
        transport.sendMail({
            from: config.mail.email,
            to: to,
            subject: subject,
            html: cont
        }, function (e, res) {
            if (e) {
                rej(new err.Exc("$core.mail.failed_send", e));
            } else {
                suc(res);
            }
        });
    });
};

exports.sendVercode = async (to) => {
    var code = reg.genCode();
    await exports.send(to, "A Little Secret", "Your verification code is " + code);
    await reg.insert(to, code);
};
