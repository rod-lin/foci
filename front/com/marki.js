/* markdown editor */

"use strict";

define([ "com/xfilt", "com/util" ], function (xfilt, util) {
    var $ = jQuery;
	foci.loadCSS("com/marki.css");

    function editor(cont, config) {
        cont = $(cont);
        config = $.extend({
            placeholder: ""
        }, config);

        var main = $("<div class='com-marki-editor'> \
            <div class='editor-toolbar'></div> \
            <div class='editor-text'> \
                <textarea class='editor-cont'></textarea> \
            </div> \
            <div class='editor-preview'></div> \
        </div>");

        cont.append(main);

        var ret = {};

        return ret;
    }

    return { editor: editor };
});
