/* club utils & components */

"use strict";

define([ "com/util", "com/login", "com/xfilt", "com/userhunt" ], function (util, login, xfilt, userhunt) {
    var $ = jQuery;
    foci.loadCSS("com/club.css");
    
    var club = {};
    
    club.parseInfo = function (info) {
        var parsed = {};
        
        parsed.cuid = info.cuid;
        parsed.dname = info.dname ? xfilt(info.dname) : "(unnamed)";
        parsed.logo = info.logo ? foci.download(info.logo) : "/img/def/logo.jpg";
        parsed.descr = info.descr ? xfilt(info.descr) : "(no description)";
        parsed.state = info.state;
        
        return parsed;
    };
    
    // a list of clubs shown on the profile
    // TODO: not finished!!!
    club.list = function (cont, config) {
        cont = $(cont);
        config = $.extend({}, config);
    
        var main = $("<div class='com-club-list'></div>");
    
        var ret = {};
        
        return ret;
    };
    
    club.popview = function (config) {
        config = $.extend({
            use_dragi: false
        }, config);
    
        var main = $("<div class='com-club-popview ui small modal'> \
            <div class='pop-cont'> \
                <div style='padding-right: 1rem;'> \
                    <div class='ui fluid search local-search'> \
                        <div class='ui icon input'> \
                            <input class='prompt' type='text' placeholder='Search club'> \
                            <i class='search icon'></i> \
                        </div> \
                        <div class='results'></div> \
                    </div> \
                </div> \
                <div class='club-list club-self-list'> \
                    <div class='club-entry find-club-entry'> \
                        <div class='club-logo'><i class='search fitted icon'></i></div> \
                        <div class='club-name'>Find club</div> \
                    </div \
                    ><div class='club-entry add-club-entry'> \
                        <div class='club-logo'><i class='add fitted icon'></i></div> \
                        <div class='club-name'>New club</div> \
                    </div \
                ></div> \
                <div class='club-list club-find-list'> \
                    <div class='club-entry return-entry'> \
                        <div class='club-logo'><i class='chevron left fitted icon'></i></div> \
                        <div class='club-name'>Back</div> \
                    </div> \
                </div> \
            </div> \
        </div>");
        
        function hide() {
            if (config.use_dragi) {
                main.dragi("close");
            } else {
                main.modal("hide");
            }
        }
        
        if (config.use_dragi) {
            main.removeClass("ui small modal")
				.dragi({
					height: "auto",
					title: "Club List"
                });
        } else {
            main.modal("show");
        }
        
        function genEntry(parsed, info) {
            var entry = $("<div class='club-entry'> \
                <div class='club-logo'> \
                    <div class='state-overlay'><i class='icon'></i></div> \
                </div> \
                <div class='club-name'></div> \
                <div class='delete-btn'><i class='fitted cancel icon'></i></div> \
                <div class='badge'><i class='fitted icon'></i></div> \
            </div>");
            
            var overlay = entry.find(".state-overlay");
            
            util.bgimg(entry.find(".club-logo"), parsed.logo);
            entry.find(".club-name").html(parsed.dname);
            
            entry.click(function () {
                // TODO: jump to club page
            });
            
            entry.find(".delete-btn").click(function () {
                if (parsed.state == foci.clubstat.review) {
                    util.ask("Are you sure to delete this club(under review)?", function (ans) {
                        if (ans) {
                            login.session(function (session) {
                                foci.encop(session, {
                                    int: "club",
                                    action: "delete",
                                    
                                    cuid: parsed.cuid
                                }, function (suc, dat) {
                                    if (suc) {
                                        util.emsg("deleted", "info");
                                        entry.remove();
                                    } else {
                                        util.emsg(dat);
                                    }
                                });
                            });
                        }
                    });
                } else {
                    util.emsg("not a club under review");
                }
            });
            
            var title_text = util.htmlToText(parsed.dname);
            
            switch (info.relation) {
                case "creator":
                    entry.addClass("show-badge");
                    entry.find(".badge").addClass("creator").attr("title", "Creator badge");
                    entry.find(".badge .icon").addClass("legal");
                    break;
                
                case "admin":
                    entry.addClass("show-badge");
                    entry.find(".badge").addClass("admin").attr("title", "Admin badge");
                    entry.find(".badge .icon").addClass("configure");
                    break;
            }
            
            switch (parsed.state) {
                case foci.clubstat.review:
                    entry.addClass("review");
                    overlay.find(".icon").addClass("wait");
                    title_text += " - under review";
                    
                    break;
                    
                case foci.clubstat.operate:
                    entry.addClass("operate");
                    break;
            }
            
            entry.attr("title", title_text);
            
            return entry;
        }
        
        var all_club = [];
        
        function renderList(dat, list, is_self) {
            for (var i = 0; i < dat.length; i++) {
                var parsed = club.parseInfo(dat[i]);
                var dom = genEntry(parsed, dat[i]);
                
                dom.attr("data-dname", parsed.dname);
                
                main.find(list).append(dom);
                
                if (is_self)
                    all_club.push(dom);
            }
            
            if (!config.use_dragi)
                main.modal("refresh");
        }
        
        function clearSearch() {
            main.find(".local-search input").val("");
        }
        
        var mode = "normal"; // or "find"
        
        // find-mode
        (function () {
            main.find(".return-entry").click(function () {
                mode = "normal";
                main.removeClass("find-mode");
                clearSearch();
            });
            
            function clearResult() {
                main.find(".club-find-list .club-entry ")
                    .not(".return-entry")
                    .remove();
            }
            
            var search_handler = null;
            
            function searchKeyDown() {
                if (mode != "find") return;
                
                if (search_handler)
                    clearTimeout(search_handler);
                
                search_handler = setTimeout(function () {
                    var kw = main.find(".local-search input").val();
                    
                    if (!kw) return;
                    
                    main.find(".local-search").addClass("loading");
                    
                    login.session(function (session) {
                        if (session) foci.encop(session, {
                            int: "club",
                            action: "search",
                            
                            kw: kw
                        }, function (suc, dat) {
                            main.find(".local-search").removeClass("loading");
                            
                            if (suc) {
                                clearResult();
                                renderList(dat, ".club-find-list", false);
                            } else {
                                util.emsg(dat);
                            }
                        });
                    });
                }, 100);
            }
            
            main.find(".local-search input").keydown(searchKeyDown);
        })();
        
        (function () {
            // settings
            
            function search(kw) {
                var reg = new RegExp(kw, "i");
                
                for (var i = 0; i < all_club.length; i++) {
                    var name = all_club[i].attr("data-dname");
                    
                    if (reg.test(name))
                        all_club[i].css("display", "");
                    else
                        all_club[i].css("display", "none");
                }
            }
            
            var search_handler = null;
            
            main.find(".local-search input").keydown(function () {
                if (mode != "normal") return;
                
                if (search_handler)
                    clearTimeout(search_handler);
                    
                search_handler = setTimeout(function () {
                    var query = main.find(".local-search input").val();
                    search(query);
                }, 100);
            });
            
            main.find(".find-club-entry").click(function () {
                mode = "find";
                main.addClass("find-mode");
                clearSearch();
                
                // userhunt.modal([], function () {
                //     
                // }, {
                //     just_one: true,
                //     use_dragi: config.use_dragi,
                //     title: "Find club",
                //     prompt: "Select club"
                // });
            });
            
            main.find(".add-club-entry").click(function () {
                util.jump("#clubreg");
                hide();
            });
            
            function clearResult() {
                main.find(".club-self-list .club-entry ")
                    .not(".add-club-entry, .find-club-entry")
                    .remove();
            }
            
            login.session(function (session) {
                foci.encop(session, {
                    int: "club",
                    action: "getrelated"
                }, function (suc, dat) {
                    if (suc) {
                        clearResult();
                        
                        // console.log(dat);
                        renderList(dat, ".club-self-list", true);
                    } else {
                        util.emsg(dat);
                    }
                });
            });
        })();
        
        var ret = {};
        
        return ret;
    };
    
    // create club modal
    // club.create = function (config) {
    //     config = $.extend({
    //         use_dragi: false
    //     }, config);
    //     
    //     var main = $("<div class='com-club-create ui small modal'> \
    //         <div class='cont'> \
    //             <div class='ui input'> \
    //                 <input> \
    //             </div> \
    //         </div> \
    //     </div>");
    //     
    //     if (config.use_dragi) {
    //         // TODO: !!!
    //     } else {
    //         main.modal("show");
    //     }
    //     
    //     var ret = {};
    //     
    //     return ret;
    // };
    
    return club;
});
