/* search */

"use strict";

define([ "com/util", "com/tagbox", "com/env", "com/seledate" ], function (util, tagbox, env, seledate) {
    var $ = jQuery;
    foci.loadCSS("com/search.css");
    
    // search box on the cover
    function cover(cont, config) {
        cont = $(cont);
        config = $.extend({}, config);
    
        var main = $("<div class='com-cover-search'> \
            <div class='search-box-cont'> \
                <div class='prompt-box'> \
                    <input class='input-no-style prompt' placeholder='Type for surprise'> \
                    <i class='search icon'></i> \
                </div> \
                <div class='filter-box'> \
                    <div class='label'>Tags</div> \
                    <div class='tagbox' style='margin-top: 0.5rem;'></div> \
                    <div class='label'>Date</div> \
                    <div class='datebox' style='margin-top: 0.5rem;'></div> \
                    <div class='datebox-selector-1'></div> \
                    <div class='datebox-selector-2'></div> \
                </div> \
            </div> \
        </div>");
        
        function updateHeight() {
            main.find(".search-box-cont").css("height",
                                              main.find(".prompt-box").outerHeight(true) +
                                              main.find(".filter-box").outerHeight(true) + "px");
        }
        
        function showFilter() {
            updateHeight();
        	main.find(".search-box-cont").addClass("expand");
                                         
            setTimeout(function () {
                main.find(".search-box-cont").css("overflow", "visible");
            }, 500);
        }
        
        function hideFilter() {
        	main.find(".search-box-cont")
                .css("height", "")
                .css("overflow", "hidden")
                .removeClass("expand");
        }
        
        main.find(".prompt").focus(showFilter);
        
        main.click(function (ev) {
        	ev.stopPropagation();
        });
        
        $("body").click(hideFilter);
        
        var tgbox;
        
        env.favtag(function (tags) {
            var init = [];
            
            for (var k in tags) {
                if (tags.hasOwnProperty(k))
                    init.push(k);
            }
            
            tgbox = tagbox.init(main.find(".tagbox"), tags, { init: init });
            
            tgbox.openEdit();
        });
        
        var start_date = seledate.gen("date a", {
                container: main.find(".datebox-selector-1"),
                pos: "bottom center",
                onHeightChange: updateHeight
            }),
            
            end_date = seledate.gen("date b", {
                container: main.find(".datebox-selector-2"),
                pos: "bottom center",
                onHeightChange: updateHeight
            });
            
        start_date.setEnd(end_date);
        end_date.setStart(start_date);
        
        main.find(".datebox").append(start_date);
        main.find(".datebox").append("<spans style='margin: 0 0.5rem;'>to</span>");
        main.find(".datebox").append(end_date);
        // main.find(".datebox").append("<spans style='margin: 0 0.5rem;'>∀ (A, B) ∈ (&lt; on set Date) </span>");
        
        main.click();
        
        start_date.click(function (ev) {
            ev.stopPropagation();
        });
        
        end_date.click(function (ev) {
            ev.stopPropagation();
        });
        
        main.find(".prompt").keydown(function (ev) {
            if (ev.which == 13) {
                var start = start_date.date();
                var end = end_date.date();
                
                util.jump("#search/" +
                          main.find(".prompt").val() + "/" +
                          tgbox.cur().join(",") + "/" +
                          (start ? start.getTime() : "") + "/" +
                          (end ? end.getTime() : ""));
            }
        });
        
        cont.append(main);
        
        var ret = {};
        
        ret.focus = function () {
            main.find(".prompt").focus();
        };
        
        ret.blur = function () {
            hideFilter();
            main.find(".prompt").blur();
        };
    
        return ret;
    }
    
    
    return { cover: cover };
});
