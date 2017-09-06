/* select date */

"use strict";

define([ "com/util" ], function (util) {
    var $ = jQuery;
    foci.loadCSS("com/seledate.css");
    
    var cur_open = null;
    
    function gen(placeholder, config) {
        config = $.extend({
            container: null,
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
        
        main.find(".cancel.icon").click(function (e) {
            selected = null;
            main.removeClass("error");
            setPrompt(placeholder);
            
            e.stopPropagation();
        });
        
        var cal_dom = null;
        var onChange = null;
        var onShow = function () {
            if (cur_open) cur_open.hideCalendar();
            cur_open = main;
        };
        
        var inline = !!config.container;
        
        if (inline) {
            cal_dom = $(config.container);
        }
        
        function showCalendar() {
            if (cur_open === main) return;
            
            if (inline) {
                cal_dom.css("display", "");
                onShow();
            } else {
                main.calendar("popup", "show");
            }
            
            if (config.onHeightChange) {
                setTimeout(config.onHeightChange, 100);
            }
        }
        
        function hideCalendar() {
            if (cur_open !== main) return;
            
            if (inline) {
                cal_dom.css("display", "none");
            } else {
                main.calendar("popup", "hide");
            }
            
            cur_open = null;
            
            if (config.onHeightChange) {
                setTimeout(config.onHeightChange, 100);
            }
        }
        
        (inline ? cal_dom : main).calendar({
            type: "date",
            inline: inline,
            
            popupOptions: {
                hideOnScrolls: true,
                position: config.pos,
                lastResort: true
            },
            
            onShow: onShow,
            
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
                    
                if (onChange)
                    onChange();
            }
        });
        
        if (inline) {
            // inline
            cal_dom.css("display", "none");
            
            main.click(function () {
                showCalendar();
            });
            
            main.find(".cancel.icon").click(function (e) {
                hideCalendar();
            });
            
            onChange = function () {
                setTimeout(function () {
                    hideCalendar();
                }, 100);
            };
        }
        
        main.hideCalendar = hideCalendar;
        main.showCalendar = showCalendar;
        
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
