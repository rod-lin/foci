/* view thumbnail */

"use strict";

define([ "com/util" ], function (util) {
    var $ = jQuery;
    foci.loadCSS("com/thumbview.css");

    var thumbview = {};

    thumbview.modal = function (url, config) {
        config = $.extend({}, config);

        var main = $("<div class='ui small modal com-thumbview-modal'> \
            <div class='cont'> \
                <img></img> \
                <div class='ui active loader'></div> \
                <div class='close-btn'><i class='fitted cancel icon'></i></div> \
            </div> \
        </div>");

        main.find("img").attr("src", url);

        var loader = main.find(".loader");

        var rproc = setInterval(function () {
            main.modal("refresh");
        }, 100);

        loader.css("display", "");
        util.img(url, function () {
            clearInterval(rproc);
            
            loader.css("display", "none");
            main.addClass("loaded");

            main.modal("refresh");
        });

        main.find(".close-btn, img").click(function () {
            mod.hide();
        });

        main.modal({
            observeChanges: true
        });

        var mod = {};

        mod.show = function () {
            main.modal("show");
        };

        mod.hide = function () {
            main.modal("hide");
        };

        return mod;
    };

    thumbview.img = function (img, config) {
        img = $(img);
        config = $.extend({}, config);

        img.css("cursor", "zoom-in");
        img.addClass("com-thumbview-zoom-img");

        var src = util.nothumb(img.attr("src"));

        var modal = null;

        var locked = false;

        img.click(function () {
            if (locked) return;
            locked = true;

            setTimeout(function () {
                locked = false;
            }, 700);

            if (!modal)
                modal = thumbview.modal(src);
            
            modal.show();
        });

        var mod = {};

        return mod;
    };

    thumbview.init = function (cont, config) {
        cont = $(cont);
        config = $.extend({}, config);

        cont.find("img").each(function (i, dom) {
            thumbview.img(dom);
        });

        var mod = {};

        return mod;
    };

    return thumbview;
});
