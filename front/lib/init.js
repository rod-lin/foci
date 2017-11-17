;$(function () {
    if (foci.nested) {
        $("html").addClass("foci-nested");
    }

    require([ "com/captcha" ], function (captcha) {
        foci.captcha(captcha.wrap); // set captcha event
    });

    require([
        "com/tbar", "com/event", "com/env",
        "com/util", "com/pages", "com/parts",
        "com/lang", "com/dragi"
    ], function (tbar, event, env, util, pages, parts, lang, dragi) {
        // fastclick.attach(document.body);

        lang.loadDict("english", util, function () {
            lang.update(document.body);
        });

        // init dragi platform
        if (!foci.nested) {
            foci.platform = dragi.platform("#platform");
        } else {
            foci.platform = top.foci.platform;
        }
        
        foci.use_dragi = true && !util.isMobile();

        // localStorage is not supported
        foci.nolocal(function () {
            util.emsg("local storage is disabled or full. please make sure that your are <b>NOT</b> in incognito mode");
        });

        env.init(function () {

            var bar = tbar.init();
            
            if (foci.nested) {
                bar.hide();
            }

            bar.menu(function () {
                util.jump("#cover");
            });

            bar.profile(function () {
                util.jump("#profile");
            });

            util.scroll("#search, #part", function (n) {
                if (n > 0) {
                    bar.showBanner();
                    // bar.applyShadow();
                } else {
                    bar.hideBanner();
                }
            }, undefined, undefined, foci.config.banner_min_scroll);

            // var cover_loaded = false;
            var pg = pages.init({
                "search": {
                    page: "#search",
                    onShow: function () {
                        bar.setTitle("Search");
                        bar.setStyle("shadowy");
                    }
                },
                
                "part": {
                    page: "#part",
                    onShow: function () {
                        bar.setStyle("");
                    }
                },
            }, { init: "search" });

            var pt = parts.init("#part", {
                penv: {
                    part: $("#part")
                },
                
                forced_refresh: [ "search", "profile", "discover" ],
                // forced to refresh even only the argument changed
                
                onJump: function (name, args) {
                    bar.hideBanner();
                    $("body").addClass("padding-tbar");

                    // alert(args[0]);

                    switch (name) {
                        case "":
                            util.jump("#cover");
                            break;

                        case "search":
                            bar.showSearch();
                            $("#main-loader").removeClass("active");

                            // format: #search/<kw>/tag1,tag2,tag3
                            var query = { kw: "" };

                            if (args[0]) {
                                query.kw = args[0];
                            }

                            if (args[1]) {
                                query.favtag = args[1].split(",");
                            }
                            
                            if (args[2]) {
                                query.after = args[2];
                            }
                            
                            if (args[3]) {
                                query.before = args[3];
                            }

                            // console.log(query);

                            research(query);
                            return true;

                        default:
                            bar.setStyle("");
                            bar.showSearch();
                            $("#main-loader").removeClass("active");
                            pg.to("part");
                    }
                }
            });

            var ev = event.init("#search>#search-cont", {
                onUpdate: function (pos) {},
                fetch: {
                    fetch: function (skip, sortby, cb) {
                        foci.get("/event/search", $.extend({ skip: skip }, cur_query, sortby), cb);
                    },

                    cont: "#search",
                    no_more_prompt: "no more results"
                },

                loader_only_on_buffer: true
            });

            env.store("tbar", bar);
            env.store("part", pt);

            bar.search(function (query, cb) {
                // research(query, cb);
                util.jump("#search/" + query.kw + "/" + (query.favtag ? query.favtag.join(",") : ""));
            });

            // re-search
            function research(query) {
                pg.to("search");
                bar.showSearchLoad();

                ev.clear(function () {
                    bar.setTitle("Search results", (query.kw || "(empty)") + ", " + (query.favtag || "all"));

                    $("#search").scrollTop(0);
                    cur_query = query;
                    
                    ev.hide();
                    ev.fetch(function () {
                        bar.hideSearchLoad();
                        ev.show();
                    });
                });
            }
        });
    });
});
