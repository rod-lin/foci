/* loadmore prompt */

"use strict";

define([ "com/util" ], function (util) {
    var $ = jQuery;
    var loadmore = {};

    foci.loadCSS("com/loadmore.css");

    loadmore.init = function (cont, no_more_prompt, cb, config) {
        cont = $(cont);
        config = $.extend({
            load_more_prompt: "load more"
        }, config);

        var main = $("<div class='com-loadmore-prompt'> \
            <div class='ui tiny active loader'></div> \
            <span class='prompt'></span> \
        </div>");
        
        var prompt = main.find(".prompt");

        prompt.html(config.load_more_prompt);

        var no_more = false;

        prompt.click(function () {
            if (!no_more) {
                main.addClass("loading");

                if (cb) cb(function (is_no_more) {
                    main.removeClass("loading");

                    if (is_no_more) {
                        no_more = true;
                        prompt.html(no_more_prompt);
                        main.addClass("no-more");
                    }
                });
            }
        });

        cont.append(main);

        var mod = {};

        mod.load = function () {
            prompt.click();
        };

        return mod;
    };

    return loadmore;
});
