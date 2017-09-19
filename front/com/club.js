/* club utils & components */

"use strict";

define([ "com/util", "com/login", "com/xfilt" ], function (util, login, xfilt) {
    var $ = jQuery;
    foci.loadCSS("com/club.css");
    
    var club = {};
    
    club.parseInfo = function (info) {
        var parsed = {};
        
        parsed.dname = info.dname ? xfilt(info.dname) : "(unnamed)";
        parsed.logo = info.logo ? foci.download(info.logo) : "/img/def/logo.jpg";
        parsed.descr = info.descr ? xfilt(info.descr) : "(no description)";
        
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
                <div class='ui fluid search local-search'> \
                    <div class='ui icon input'> \
                        <input class='prompt' type='text' placeholder='Search club'> \
                        <i class='search icon'></i> \
                    </div> \
                    <div class='results'></div> \
                </div> \
                <div class='club-list'> \
                    <div class='club-entry add-club-entry'> \
                        <div class='club-logo'><i class='add fitted icon'></i></div> \
                        <div class='club-name'>New Club</div> \
                    </div> \
                </div> \
            </div> \
        </div>");
        
        if (config.use_dragi) {
            main.removeClass("ui small modal")
				.dragi({
					height: "auto",
					title: "Club List"
                });
        } else {
            main.modal("show");
        }
        
        (function () {
            // settings
            
            var all_club = [];
            
            function hide() {
                if (config.use_dragi) {
                    main.dragi("close");
                } else {
                    main.modal("hide");
                }
            }
            
            main.find(".local-search input").keydown(function () {
                var query = main.find(".local-search input").val();
                var reg = new RegExp(query, "i");
                
                for (var i = 0; i < all_club.length; i++) {
                    var name = all_club[i].attr("data-dname");
                    
                    if (reg.test(name))
                        all_club[i].css("display", "");
                    else
                        all_club[i].css("display", "none");
                }
            });
            
            main.find(".add-club-entry").click(function () {
                util.jump("#clubreg");
                hide();
            });
            
            function genEntry(parsed) {
                var entry = $("<div class='club-entry'> \
                    <div class='club-logo'></div> \
                    <div class='club-name'></div> \
                </div>");
                
                util.bgimg(entry.find(".club-logo"), parsed.logo);
                entry.find(".club-name").html(parsed.dname);
                
                entry.attr("title", util.htmlToText(parsed.dname));
                
                entry.click(function () {
                    // TODO: jump to club page
                });
                
                return entry;
            }
            
            function clearResult() {
                main.find(".club-list .club-entry").not(".add-club-entry").remove();
            }
            
            login.session(function (session) {
                foci.encop(session, {
                    int: "club",
                    action: "getrelated"
                }, function (suc, dat) {
                    if (suc) {
                        clearResult();
                        
                        // console.log(dat);
                        
                        for (var i = 0; i < dat.length; i++) {
                            var parsed = club.parseInfo(dat[i]);
                            var dom = genEntry(parsed);
                            
                            dom.attr("data-dname", parsed.dname);
                            
                            main.find(".club-list").append(dom);
                            
                            all_club.push(dom);
                        }
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
