/* draggable window */

"use strict";

define([], function () {
    var $ = jQuery;
    foci.loadCSS("com/dragi.css");

    var dragi = {};
    
    // platform to place windows
    dragi.platform = function (cont, config) {
        cont = $(cont);
        config = $.extend({}, config);
        
        var main = $("<div class='com-dragi-platform'></div>");
        
        cont.append(main);
        
        var mod = {};
        
        mod.dom = main;
        
        return mod;
    };
    
    dragi.window = function (cont, config) {
        cont = $(cont);
        config = $.extend({
            left: 20,
            top: 20,
            position: "fixed",
            margin: 10,
            
            min_width: 400,
            min_height: 300
        }, config);
        
        var win = $("<div class='com-dragi-window'> \
            <div class='nav'> \
                <div class='title'>Hello, world</div> \
                <i class='resize-btn maximize fitted icon'></i> \
            </div> \
            <div class='cont'></div> \
            <div class='resize-point top only'></div> \
            <div class='resize-point right only'></div> \
            <div class='resize-point bottom only'></div> \
            <div class='resize-point left only'></div> \
             \
            <div class='resize-point right bottom'></div> \
            <div class='resize-point left bottom'></div> \
            <div class='resize-point right top'></div> \
            <div class='resize-point left top'></div> \
        </div>");
        
        win.css({
            position: config.position,
            left: config.left,
            top: config.top
        });
        
        function initWindow() {
            var origx, origy;
            var lastx, lasty;
            var start = false;
            var margin = config.margin;
            
            win.width(config.min_width);
            win.height(config.min_height);
            
            function setSelect(dom, enable) {
                $(dom).css({
                    "user-select": enable ? "auto" : "none",
                    "-moz-user-select": enable ? "auto" : "none"
                });
            }
        
            win.children(".nav").mousedown(function (e) {
                if (start) return;
                start = "drag";
                
                var pos = win.position();
                
                origx = pos.left;
                origy = pos.top;
                
                lastx = e.clientX;
                lasty = e.clientY;
                
                setSelect($(window), false);
            });
            
            $(window).mousemove(function (e) {
                if (start == "drag") {
                    var nextx = e.clientX - lastx + origx;
                    var nexty = e.clientY - lasty + origy;

                    var maxx = $(window).width() - win.width(),
                        maxy = $(window).height() - win.height();
                    
                    // if (maxx > 0) {
                    //     if (nextx < 0) nextx = margin;
                    //     if (nextx > maxx)
                    //         nextx = maxx - margin;
                    // }
                    // 
                    // if (maxy > 0) {
                    //     if (nexty < 0) nexty = margin;
                    //     if (nexty > maxy)
                    //         nexty = maxy - margin;
                    // }
                    
                    win.css("left", nextx + "px");
                    win.css("top", nexty + "px");
                }
            });
            
            win.mouseup(function () {
                start = false;
                setSelect($(window), true);
            });
            
            function resizePointDown(dir, dirx, diry, left_ofs, top_ofs) {
                var initx, inity;
                var origx, origy;
                var origw, origh;
                
                $(window).mousemove(function (e) {
                    if (start == "resize-" + dir) {
                        var deltaw = (e.clientX - initx) * dirx;
                        var deltah = (e.clientY - inity) * diry;
                        
                        var nextw = origw + deltaw;
                        var nexth = origh + deltah;
                        
                        if (nextw < config.min_width) {
                            nextw = config.min_width;
                        }
                        
                        if (nexth < config.min_height) {
                            nexth = config.min_height;
                        }
                        
                        win.width(nextw);
                        win.height(nexth);
                        
                        win.css("left", origx + (nextw - origw) * left_ofs + "px");
                        win.css("top", origy + (nexth - origh) * top_ofs + "px");
                    }
                });
                
                win.mouseup(function () {
                    start = false;
                    setSelect($(window), true);
                });
                
                return function (e) {
                    if (start) return;
                    start = "resize-" + dir;
                    setSelect($(window), false);
                    
                    var pos = win.position();
                    
                    origx = pos.left;
                    origy = pos.top;
                    
                    initx = e.clientX;
                    inity = e.clientY;
                    origw = win.width();
                    origh = win.height();
                };
            }
            
            win.children(".right.bottom.resize-point")
                .mousedown(resizePointDown("right-bottom", 1, 1, 0, 0));
            win.children(".left.bottom.resize-point")
                .mousedown(resizePointDown("left-bottom", -1, 1, -1, 0));
            win.children(".right.top.resize-point")
                .mousedown(resizePointDown("right-top", 1, -1, 0, -1));
            win.children(".left.top.resize-point")
                .mousedown(resizePointDown("left-top", -1, -1, -1, -1));
                
            win.children(".top.only.resize-point")
                .mousedown(resizePointDown("top-only", 0, -1, 0, -1));
            win.children(".bottom.only.resize-point")
                .mousedown(resizePointDown("bottom-only", 0, 1, 0, 0));
            win.children(".right.only.resize-point")
                .mousedown(resizePointDown("right-only", 1, 0, 0, 0));
            win.children(".left.only.resize-point")
                .mousedown(resizePointDown("left-only", -1, 0, -1, 0));
        }
        
        initWindow();
            
        cont.append(win);
        
        var mod = {};
        
        return mod;
    };

    return dragi;
});
