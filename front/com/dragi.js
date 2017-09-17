/* draggable window */

"use strict";

define([], function () {
    var $ = jQuery;
    foci.loadCSS("com/dragi.css");

    var dragi = {};
    
    // platform to place windows
    dragi.platform = function (cont, config) {
        cont = $(cont);
        config = $.extend({
            default_zindex: 101
        }, config);
        
        var main = $("<div class='com-dragi-platform'></div>");
        
        cont.append(main);
        
        var mod = {};
        
        mod.dom = main;
        
        var win_list = [];
        var cur_focus = null;
        
        mod.addWindow = function (win) {
            main.append(win.dom);
            
            win.dom.css("z-index", config.default_zindex);
            
            win_list.push(win_list);
            mod.focus(win);
        };
        
        function setFocus(dom, is_focus) {
            dom.css("z-index", is_focus ? config.default_zindex + 1 : config.default_zindex);
        }
        
        mod.focus = function (win) {
            if (cur_focus)
                setFocus(cur_focus.dom, false);
                
            cur_focus = win;
            setFocus(win.dom, true);
        };
        
        mod.remove = function (win) {
            var i = win_list.indexOf(win);
            
            if (i != -1) {
                win.dom.remove();
                win_list.splice(i, 0);
                
                if (cur_focus == win) {
                    cur_focus = null;
                }
            }
        };
        
        return mod;
    };
    
    dragi.window = function (platform, config) {
        config = $.extend({
            left: 80,
            top: 80,
            position: "fixed",
            margin: 10,
            
            min_width: 400,
            min_height: 250,
            
            width: 400,
            height: 250,
            
            resize: true,
            scroll: true,
            
            title: "(untitled)",
            
            onOpen: null,
            onClose: null
        }, config);
        
        var win = $("<div class='com-dragi-window ui transition hidden'> \
            <div class='nav'> \
                <div class='title'></div> \
                <i class='maximize-btn minus fitted icon'></i> \
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
        
        var win_cont = win.children(".cont");
        var nav = win.children(".nav");
        
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
            
            function setSelect(dom, enable) {
                $(dom).css({
                    "user-select": enable ? "auto" : "none",
                    "-moz-user-select": enable ? "auto" : "none"
                });
            }
            
            function setPointer(dom, enable) {
                $(dom).css({
                    "pointer-events": enable ? "auto" : "none",
                });
            }
            
            nav.find(".maximize-btn").click(function () {
                mod.close();
            });
            
            win.mousedown(function () {
                platform.focus(mod);
            }).on("touchstart", function () {
                platform.focus(mod);
            });
            
            function getClientPos(e, name) {
                if (e.touches) {
                    return e.touches[0]["client" + name];
                } else {
                    return e["client" + name];
                }
            }
            
            function dragMouseDown(e) {
                if (start) return;
                start = "drag";
                
                var pos = win.position();
                
                origx = pos.left;
                origy = pos.top;
                
                lastx = getClientPos(e, "X");
                lasty = getClientPos(e, "Y");
                
                setSelect($(window), false);
                setPointer(win_cont, false);
            }
            
            function dragMouseMove(e) {
                if (start == "drag") {
                    var nextx = getClientPos(e, "X") - lastx + origx;
                    var nexty = getClientPos(e, "Y") - lasty + origy;

                    var maxx = $(window).width() - win_cont.width(),
                        maxy = $(window).height() - win_cont.height();
                    
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
            }
            
            function dragMouseUp() {
                start = false;
                setSelect($(window), true);
                setPointer(win_cont, true);
            }
        
            nav.mousedown(dragMouseDown).on("touchstart", dragMouseDown);
            $(window).mousemove(dragMouseMove).on("touchmove", dragMouseMove);
            win.mouseup(dragMouseUp).on("touchend", dragMouseUp);
            
            function resizePointInit(dom, dir, dirx, diry, left_ofs, top_ofs) {
                var initx, inity;
                var origx, origy;
                var origw, origh;
                
                function resizeMouseDown(e) {
                    if (start) return;
                    start = "resize-" + dir;
                    setSelect($(window), false);
                    setPointer(win_cont, false);
                    
                    var pos = win.position();
                    
                    origx = pos.left;
                    origy = pos.top;
                    
                    initx = getClientPos(e, "X");
                    inity = getClientPos(e, "Y");
                    origw = win_cont.width();
                    origh = win_cont.height();
                }
                
                function resizeMouseMove(e) {
                    if (start == "resize-" + dir) {
                        var deltaw = (getClientPos(e, "X") - initx) * dirx;
                        var deltah = (getClientPos(e, "Y") - inity) * diry;
                        
                        var nextw = origw + deltaw;
                        var nexth = origh + deltah;
                        
                        if (nextw < config.min_width) {
                            nextw = config.min_width;
                        }
                        
                        if (nexth < config.min_height) {
                            nexth = config.min_height;
                        }
                        
                        mod.resizeTo(nextw, nexth);
                        
                        win.css("left", origx + (nextw - origw) * left_ofs + "px");
                        win.css("top", origy + (nexth - origh) * top_ofs + "px");
                    }
                }
                
                function resizeMouseUp() {
                    start = false;
                    setSelect($(window), true);
                    setPointer(win_cont, true);
                }
                
                $(window).mousemove(resizeMouseMove).on("touchmove", resizeMouseMove);
                win.mouseup(resizeMouseUp).on("touchend", resizeMouseUp);
                $(dom).mousedown(resizeMouseDown).on("touchstart", resizeMouseDown);
            }
            
            resizePointInit(win.children(".right.bottom.resize-point"), "right-bottom", 1, 1, 0, 0);
            resizePointInit(win.children(".left.bottom.resize-point"), "left-bottom", -1, 1, -1, 0);
            resizePointInit(win.children(".right.top.resize-point"), "right-top", 1, -1, 0, -1);
            resizePointInit(win.children(".left.top.resize-point"), "left-top", -1, -1, -1, -1);
                
            resizePointInit(win.children(".top.only.resize-point"), "top-only", 0, -1, 0, -1);
            resizePointInit(win.children(".bottom.only.resize-point"), "bottom-only", 0, 1, 0, 0);
            resizePointInit(win.children(".right.only.resize-point"), "right-only", 1, 0, 0, 0);
            resizePointInit(win.children(".left.only.resize-point"), "left-only", -1, 0, -1, 0);
        }
        
        var mod = {};
        
        mod.dom = win;
        mod.cont = win.children(".cont");
        
        mod.resize = function (enable) {
            win.children(".resize-point").css("display", enable ? "" : "none");
        };
        
        mod.resizeTo = function (w, h) {
            if (w === "auto") {
                win_cont.css("width", "auto");
                win.css("width", "auto");
            } else {
                if (w < config.min_width) {
                    w = config.min_width;
                }
                
                win_cont.width(w);
                win.width(w);
            }
            
            if (h === "auto") {
                win_cont.css("height", "auto");
            } else {
                if (h < config.min_height) {
                    h = config.min_height;
                }
                
                win_cont.height(h);
            }
        };
        
        mod.title = function (arg) {
            if (arg !== undefined) {
                nav.find(".title").text(arg).attr("title", arg);
            } else {
                return nav.find(".title").text();
            }
        };
        
        mod.close = function () {
            if (config.onClose && config.onClose() === false) {
                return;
            }
            
            win.transition("scale out");
            setTimeout(function () {
                platform.remove(mod);
            }, 1000);
        };
        
        mod.show = function () {
            win.transition("scale in");
        };
        
        mod.hide = function () {
            win.transition("scale out");
        };
        
        mod.resize(config.resize);
        mod.title(config.title);
        
        win.ready(function () {
            initWindow();
            mod.resizeTo(config.width, config.height);
            win.transition("scale in");
            
            win_cont.css("overflow", config.scroll ? "auto" : "hidden");
            
            if (config.onOpen) config.onOpen();
        });
        
        platform.addWindow(mod);
        
        return mod;
    };
    
    dragi.dom = function (platform, dom, config) {
        dom = $(dom);
        
        config = $.extend({}, config);
        
        var win = dragi.window(platform, config);
        
        win.cont.append(dom);
        
        // dom.ready(function () {
        //     // alert([ dom.width(), dom.height() ]);
        //     win.resizeTo(dom.width(), dom.height());
        // });
        
        return win;
    };

    // create a window with a iframe
    dragi.iframe = function (platform, url) {
        var win = dragi.window(platform, { scroll: false });
        
        var iframe = $("<iframe class='com-dragi-iframe'></iframe>");
        iframe[0].src = url;
        
        iframe[0].onload = function () {
            setInterval(function () {
                win.title(iframe[0].contentWindow.document.title);
            }, 1000);
        };
        
        win.cont.append(iframe);
        
        return win;
    };
    
    $.fn.extend({
        dragi: function () {
            var cmd = arguments[0];
            var args = Array.prototype.slice.apply(arguments).slice(1);
            
            if (!this._dragi_win)
                this._dragi_win = dragi.dom(foci.platform, this, typeof cmd === "object" ? cmd : {});
                
            switch (cmd) {
                case "enable resize":
                    this._dragi_win.resize(true);
                    break;
                    
                case "disable resize":
                    this._dragi_win.resize(false);
                    break;
                    
                case "resize":
                    this._dragi_win.resizeTo(args[0], args[1]);
                    break;
                    
                case "title":
                    this._dragi_win.title(args[0]);
                    break;
                
                case "close":
                    this._dragi_win.close();
                    break;
                    
                case "show":
                    this._dragi_win.show();
                    break;
                
                case "hide":
                    this._dragi_win.hide();
                    break;
                
                default:;
            }
            
            return this;
        }
    });

    return dragi;
});

