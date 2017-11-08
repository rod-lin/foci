/* wechat util */

"use strict";

var db = require("./db");
var err = require("./err");
var util = require("./util");
var file = require("./file");

var request = require("request-promise");
var cheerio = require("cheerio");

var article_url = code => "https://mp.weixin.qq.com/" + code;

exports.getArticleContent = async (code) => {
    var html = await request.get(article_url(code));
    var $ = cheerio.load(html);
    var img = /https?:\/\/mmbiz.qpic.cn\/mmbiz_([^/]+)\/[^'")]*/;

    var map = {};

    var urls = [];
    
    $("#js_content img[data-src]").each(function (i, dom) {
        dom = $(dom);
        
        var url = dom.attr("data-src");
        var match = url.match(img);

        urls.push(url);

        var type = "image/jpeg";
    
        if (match) switch (match[1]) {
            case "png":
                type = "image/png";
                break;

            case "gif":
                type = "image/gif";
                break;

            case "jpg":
            default: break;
        }

        var derefered = "/file/derefer?type=" + encodeURIComponent(type) + "&url=" + encodeURIComponent(url);

        map[url] = derefered;

        dom
            .attr("data-src", "")
            .attr("src", derefered)
            .addClass("frameless img");
    });

    await file.logDereferAll(urls);

    var text = $("#js_content").html();
    var i = 0;

    for (var url in map) {
        if (map.hasOwnProperty(url)) {
            var final = "url(" + map[url] + ")";
            text = text.replaceAll("url(" + url + ")", final);
            text = text.replaceAll("url(\"" + url + "\")", final);
            text = text.replaceAll("url('" + url + "')", final);
        }
    }

    return text;
};
