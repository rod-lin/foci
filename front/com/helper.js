/* helper modal */

"use strict";

define([ "com/util" ], function (util) {
    var $ = jQuery;
    foci.loadCSS("com/helper.css");

    function init(src, config) {
        var main = $("<div class='com-helper ui small modal'> \
            <div style='text-align: right;'> \
                <button class='ui blue fitted button got-btn'>Got it</button> \
            </div> \
        </div>");

        main.prepend(markdown.toHTML(src));

        main.modal().modal("show");
        main.find(".got-btn").click(function () {
            main.modal("hide");
        });

        var ret = {};

        return ret;
    }

    return { init: init };
});
