/* copyright */

"use strict";

define([ "com/util" ], function (util) {
    var $ = jQuery;
    foci.loadCSS("com/copyright.css");

    function init(cont, config) {
        cont = $(cont);
        config = $.extend({}, config);

        var main = $("<div class='com-copyright'> \
            <a href=''>Agreement</a>, <a href=''>About</a>, <a href=''>Help</a><br> \
            <a href='http://www.12377.cn/' target='_blank'>网上有害信息举报专区</a><br> \
            <span><a class='contact-link'>Contact</a> © 2017 Foci</span> \
        </div>");

        main.find(".contact-link").click(function () {
            util.jump("#contact", true);
        });

        cont.append(main);

        return {};
    }

    return { init: init };
});
