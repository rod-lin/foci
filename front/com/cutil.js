/* club utility panel */

"use strict";

define([ "com/util", "com/waterfall" ], function (util, waterfall) {
    var $ = jQuery;
    foci.loadCSS("com/cutil.css");
    
    var cutil = {};
    
    cutil.init = function (cont, config) {
        cont = $(cont);
        config = $.extend({}, config);

        var main = $("<div class='com-cutil-panel'> \
            <h3 class='ui grey header'>Club Utilities & Discover</h3> \
            <div class='board-set'></div> \
            <div class='load-prompt'>no more utilities</div> \
        </div>");

        var board_set = main.find(".board-set");

        // bconf { title, descr, cover }
        function genBoard(bconf) {
            var bd = $("<div class='board'> \
                <div class='info'> \
                    <div class='vcenter'> \
                        <h3 class='title'></h3> \
                        <span class='descr'></span> \
                    </div> \
                </div> \
            </div>");

            if (bconf.cover)
                util.bgimg(bd, bconf.cover);
            
            bd.find(".title").html(bconf.title);
            bd.find(".descr").html(bconf.descr);

            bd.click(function () {
                if (bconf.url) {
                    util.jump(bconf.url);
                }
            });

            return bd;
        }

        var wf = waterfall.init(board_set, {
            onUpdate: function (pos) {
                main.children(".header").css("margin-left", (pos.left || 20) + "px");
            }
        });

        wf.add(genBoard({
            title: "McOriginal Care",
            descr: "A club organizing service and funding provided by McOriginal",
            url: "#discover/mcocare"
        }));

        wf.add(genBoard({
            title: "Poster Printing",
            descr: "Poster printing service"
        }));

        wf.add(genBoard({
            title: "File Storage",
            descr: "File storage & share service"
        }));

        wf.add(genBoard({
            title: "Quiz",
            descr: "Quiz helper"
        }));

        setTimeout(wf.update, 300);

        cont.append(main);

        var mod = {};

        mod.updateWF = function () {
            wf.update();
        };

        return mod;
    };
    
    return cutil;
});
