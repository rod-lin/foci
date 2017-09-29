/* wechat util */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");

var request = require("request-promise");
var cheerio = require("cheerio");

var article_url = code => "https://mp.weixin.qq.com/s/" + code;

exports.getArticleContent = async (code) => {
    var html = await request.get(article_url(code));
    var $ = cheerio.load(html);
    return $("#js_content").html();
};
