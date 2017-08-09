/* email */

"use strict";

var err = require("./err");
var reg = require("./reg");
var util = require("./util");
var auth = require("./auth");
var config = require("./config");
var template = require("./template");

var nodemailer = require("nodemailer");
var smtp = require("nodemailer-smtp-transport");

var transport;

function initTransport() {
    transport = nodemailer.createTransport(smtp({
        service: config.mail.service,
        auth: {
            user: config.mail.email,
            pass: config.mail.passwd
        }
    }));
}

if (config.mail.passwd_enc) {
    util.ask("password for mail service: ", (key) => {
        config.mail.passwd = auth.aes.dec(config.mail.passwd, key);
        initTransport();
    });
} else {
    initTransport();
}

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
    var cont = await template.email_vericode(code);
    await exports.send(to, cont.title, cont.cont);
    await reg.insert(to, code);
};
