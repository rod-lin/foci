/* select date */

"use strict";

define([ "com/util" ], function (util) {
    var $ = jQuery;
    foci.loadCSS("com/seledate.css");
    
    var cur_open = null;
    
    function gen(placeholder, config) {
        config = $.extend({
            pos: "bottom left"
        }, config);
        
        var main = $("<div class='com-seledate'><span class='date-prompt'></span><i class='cancel icon'></i></div>");
        
        function setPrompt(prompt) {
            main.find(".date-prompt").html(prompt);
        }
        
        var selected = null;
        var start = null,
            end = null;
        
        setPrompt(placeholder);
        
        main.find(".cancel.icon").click(function () {
            selected = null;
            main.removeClass("error");
            setPrompt(placeholder);
        });
        
        main.calendar({
            type: "date",
            popupOptions: {
                hideOnScrolls: true,
                position: config.pos,
                lastResort: true
            },
            
            onShow: function () {
                if (cur_open) cur_open.calendar("popup", "hide");
                cur_open = main;
            },
            
            onChange: function (date, text, mode) {
                main.removeClass("error");
                
                selected = date;
                
                if (date) {
                    if ((end && end.date() && date >= end.date()) ||
                        (start && start.date() && date <= start.date())) {
                        main.addClass("error");
                        util.emsg("date not in range");
                        return false;
                    } else
                        setPrompt(text);
                } else
                    setPrompt(placeholder);
            }
        });
        
        main.close = function () {
            main.calendar("popup", "hide");
        };
        
        main.date = function () {
            return selected;
        };
        
        main.setError = function () {
            main.addClass("error");
        };
        
        // set start/end calendar
        main.setStart = function (obj) {
            start = obj;
        };
        
        main.setEnd = function (obj) {
            end = obj;
        };
        
        return main;
    }
    
    return { gen: gen };
});
