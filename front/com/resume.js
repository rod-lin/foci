/* resume */

"use strict";

define([ "com/util" ], function (util) {
    foci.loadCSS("com/resume.css");

    function init(cont, uuid, config) {
        cont = $(cont);
        config = $.extend({}, config);

        var main = $("<div class='com-resume'> \
            <div class='resume-tag'>2015-06-08</div> \
            <div class='resume-item'> \
                <div class='resume-cover'></div> \
                <div class='resume-prompt'>hi</div> \
                <div class='resume-fixed'> \
                    <i class='settings icon'></i> \
                    <i class='pin icon'></i> \
                </div> \
            </div> \
            <div class='resume-item'> \
                <div class='resume-cover'></div> \
            </div> \
        </div>");

        cont.append(main);

        var ret = {};

        return ret;
    }

    return { init: init };
});
