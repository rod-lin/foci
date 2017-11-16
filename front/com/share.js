/* social media share utility */

"use strict";

define([ "com/util", "com/popselect" ], function (util, popselect) {
    var $ = jQuery;
    var share = {};

    foci.loadCSS("com/share.css");

    function ShareObj(url, title, descr, logo, conf) {
        this.url = url;
        this.title = title;
        this.descr = descr;
        this.logo = logo;

        $.extend(this, conf);
    }

    share.ShareObj = ShareObj;

    share.shareQzone = function (shobj) {
        var args = {
            url: shobj.url,
            title: shobj.title,
            summary: shobj.descr,
            pics: shobj.logo,
            site: shobj.site || "Foci"
        };

        var query = [];

        for (var k in args) {
            if (args.hasOwnProperty(k)) {
                query.push(encodeURIComponent(k) + "=" + encodeURIComponent(args[k]));
            }
        }

        var url = "https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?" + query.join("&");
        util.newTab(url);
    }

    share.popup = function (btn, shobj, config) {
        btn = $(btn);
        config = $.extend({}, config);

        function genAlignedItem(icon, name) {
            var item = $("<div><i class='" + icon + " icon' style='margin-right: 0.5rem;'></i><span>" + name + "</span></div>");
            return item;
        }

        var copy_url = genAlignedItem("external", "Copy URL");

        util.bindCopy(copy_url, shobj.url);

        var pop = popselect.init(btn, [
            {
                cont: genAlignedItem("qq", "Qzone"),
                onSelect: function () {
                    share.shareQzone(shobj);
                }
            }, /* {
                cont: genAlignedItem("wechat", "Wechat")
            }, */ {
                cont: copy_url,
            }
        ], {});

        var mod = {};

        return mod;
    };

    return share;
});
