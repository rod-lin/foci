/* wechat util */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");

var request = require("request-promise");
var cheerio = require("cheerio");

var article_url = code => "https://mp.weixin.qq.com/" + code;

var imgDerefer = async (html) => {
    var img = /https?:\/\/mmbiz.qpic.cn\/mmbiz_([^/]+)\/[^'")]*/g;
    var imgi = /https?:\/\/mmbiz.qpic.cn\/mmbiz_([^/]+)\/[^'")]*/;

    var type;

    html = html.replace(img, function (cont) {
        var match = cont.match(imgi);

        // console.log(cont, match[1]);

        switch (match[1]) {
            case "png":
                type = "image/png";
                break;

            case "jpg":
            default:
                type = "image/jpeg";
                break;
        }

        return "/file/derefer?type=" + encodeURIComponent(type) + "&url=" + encodeURIComponent(cont);
    });

    // console.log(html);

    return html;
};

exports.getArticleContent = async (code) => {
    var html = await request.get(article_url(code));
    var $ = cheerio.load(html);
    var img = /https?:\/\/mmbiz.qpic.cn\/mmbiz_([^/]+)\/[^'")]*/;

    $("#js_content img[data-src]").each(function (i, dom) {
        dom = $(dom);
        
        var url = dom.attr("data-src");
        var match = url.match(img);

        var type;

        switch (match[1]) {
            case "png":
                type = "image/png";
                break;

            case "jpg":
            default:
                type = "image/jpeg";
                break;
        }

        dom
            .attr("src", "/file/derefer?type=" + encodeURIComponent(type) + "&url=" + encodeURIComponent(url))
            .addClass("frameless img");
    });

    return $("#js_content").html();
};
