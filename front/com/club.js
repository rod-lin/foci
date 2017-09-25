/* club utils & components */

"use strict";

define([
    "com/util", "com/login", "com/xfilt",
    "com/userhunt", "com/env", "com/pm",
    "com/popselect"
], function (util, login, xfilt, userhunt, env, pm, popselect) {
    var $ = jQuery;
    foci.loadCSS("com/club.css");
    
    var club = {};
    
    club.parseInfo = function (info) {
        var parsed = {};
        
        parsed.cuid = info.cuid;
        
        parsed.dname = info.dname ? xfilt(info.dname) : "(unnamed)";
        parsed.logo = info.logo ? foci.download(info.logo) : "/img/def/logo.jpg";
        parsed.school = info.school ? xfilt(info.school) : "(no school)";
        parsed.descr = info.descr ? xfilt(info.descr) : "(no description)";
        
        parsed.member_count = info.member_count ? info.member_count : 0;
        
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
    
    function local_search(config) {
        config = $.extend({
            prompt: "Search club"
        }, config);
        
        var search = $("<div class='com-club-search ui fluid search'> \
            <div class='ui icon input'> \
                <input class='prompt' type='text'> \
                <i class='search icon'></i> \
            </div> \
            <div class='results'></div> \
        </div>");
        
        search.find(".prompt").attr("placeholder", config.prompt);
        
        return search;
    }
    
    // member list
    club.memlist = function (cont, cuid, config) {
        cont = $(cont);
        config = $.extend({
            info: {},
            use_dragi: false
        }, config);
        
        config.info = club.parseInfo(config.info);
    
        var main = $("<div class='com-club-memlist'> \
            <div class='member-search' style='display: none;'> \
                <div></div> \
            </div> \
            <div class='action-bar'> \
                <button class='join-btn ui green basic button'><i class='user outline icon'></i>Join</button> \
                <button class='invite-btn ui blue basic button'><i class='add icon'></i>Invite</button> \
            </div> \
            <div class='apply-member club-only-admin'></div> \
            <div class='members'></div> \
            <div class='no-login-prompt'>Please <a class='login-link'>login</a> first</div> \
        </div>");
        
        function changeApplyProc(accept, uuid, cb) {
            return function () {
                login.session(function (session) {
                    if (session) foci.encop(session, {
                        int: "club",
                        action: "changeapply",
                        
                        cuid: cuid,
                        uuid: uuid,
                        
                        accept: accept
                    }, function (suc, dat) {
                        if (suc) {
                            cb(accept);
                        } else {
                            util.emsg(dat);
                        }
                    });
                });
            };
        }
        
        function badge(type, title) {
            var badge = $("<div class='badge'></div>");
            
            switch (type) {
                case "creator":
                    badge.addClass("creator").html("Creator");
                    break;
                    
                case "apply":
                    badge.addClass("apply").html("Applicant");
                    break;
                    
                case "admin":
                    badge.addClass("admin").html("Admin");
                    break;
                    
                case "self":
                    badge.addClass("self").html("Me");
                    break;
                    
                case "title":
                    badge.addClass("title").html(xfilt(title));
                    break;
            }
            
            return badge;
        }
    
        function genMember(uuid, mem, session) {
            var member = $("<div class='member-item'> \
                <div class='bar'> \
                    <div class='avatar'></div> \
                    <div class='dname'>loading</div> \
                    <div class='badges'></div> \
                    <div class='expand'></div> \
                    <div class='toolbar'> \
                        <i class='toolbtn chat-btn comments outline icon'></i> \
                        <i class='toolbtn chevron down icon club-only-admin not-apply'></i> \
                        <i class='toolbtn check icon only-apply'></i> \
                    </div> \
                </div> \
                <div class='expand-cont club-only-admin'> \
                    <div class='comment-box only-apply'> \
                        <span class='prompt'>Comment</span> \
                        <span class='comment'></span> \
                        <div style='margin-top: 1rem;'> \
                            <button class='dec-btn ui basic red button'>Decline</button> \
                            <button class='acc-btn ui basic green button'>Accept</button> \
                        </div> \
                    </div> \
                    <div class='setting-box club-only-admin not-apply'> \
                        <span class='prompt'>Settings</span> \
                        <div class='ui form' style='margin-top: 1rem;'> \
                            <div class='fields' style='margin-bottom: 0;'> \
                                <div class='field'> \
                                    <label>Title</label> \
                                    <input class='field-mem-title'> \
                                </div> \
                                <div class='field' style='margin-top: 1rem;'> \
                                    <label>Admin</label> \
                                    <div class='ui toggle checkbox field-mem-is-admin'> \
        								<input type='checkbox'> \
        								<label>Is administrator</label> \
        							</div> \
                                </div> \
                            </div> \
                            <button class='save-btn ui basic green button' style='margin-top: 1rem;'>Save</button> \
                            <button class='remove-btn ui basic red button not-self' style='margin-top: 1rem;'>Remove this member</button> \
                        </div> \
                    </div> \
                </div> \
            </div>");
            
            foci.get("/user/info", { uuid: uuid }, function (suc, dat) {
                if (suc) {
                    var parsed = login.parseInfo(dat);
                    
                    util.bgimg(member.find(".avatar"), parsed.avatar);
                    member.find(".dname").html(parsed.dname);
                } else {
                    util.emsg(dat);
                }
            });
            
            if (session.getUUID() == uuid) {
                member.find(".chat-btn").remove();
            } else {
                member.find(".chat-btn").click(function (e) {
                    e.stopPropagation();
                    pm.chatbox(uuid, { use_dragi: config.use_dragi });
                });
            }
            
            if (mem.is_app) {
                member.find(".comment").html(xfilt(mem.comment ? mem.comment : "(no comment)"));
                member.addClass("apply");
                member.find(".badges").append(badge("apply"));
            } else if (mem.is_creator) {
                member.find(".badges").append(badge("creator"));
            } else if (mem.is_admin) {
                member.find(".badges").append(badge("admin"));
            }
            
            if (uuid == session.getUUID()) {
                member.find(".badges").append(badge("self"));
                member.addClass("self");
            }
            
            if (mem.title) {
                member.find(".badges").append(badge("title", mem.title));
            }
            
            member.find(".avatar").click(function () {
                util.jump("#profile/" + uuid);
            });
            
            function toggle(dom) {
                dom.toggleClass("selected");
                dom.find(".chevron").toggleClass("up down");
                
                if (dom.hasClass("selected")) {
                    dom.css("height", dom.outerHeight() + dom.find(".expand-cont").outerHeight() + "px");
                } else {
                    dom.css("height", "");
                }
            }
            
            member.click(function () {
                if (!member.hasClass("selected"))
                    toggle(main.find(".member-item.selected"));
                    
                toggle(member);
            });
            
            member.find(".expand-cont").click(function (e) {
                e.stopPropagation();
            });
            
            var refresh = function () {
                member.after(genMember(uuid, mem, session));
                member.remove();
            }
            
            var update = function (accept) {
                if (accept) {
                    mem.is_app = false;
                    refresh();
                } else {
                    member.css("height", "0");
                    
                    setTimeout(function () {
                        member.remove();
                    }, 300);
                }
            };
        
            if (mem.is_app) {
                member.find(".dec-btn").click(changeApplyProc(false, uuid, update));
                member.find(".acc-btn").click(changeApplyProc(true, uuid, update));
            }
            
            // settings
            (function () {
                member.find(".field-mem-is-admin").checkbox();
                
                if (mem.is_creator) {
                    member.find(".field-mem-is-admin").checkbox("set disabled");
                }
                
                if (mem.is_admin) {
                    member.find(".field-mem-is-admin").checkbox("set checked");
                }
                
                member.find(".field-mem-title").val(mem.title ? mem.title : "");
                
                member.find(".save-btn").click(function () {
                    var title = member.find(".field-mem-title").val();
                    var is_admin = member.find(".field-mem-is-admin").checkbox("is checked");
                
                    member.find(".save-btn").addClass("loading");
                
                    login.session(function (session) {
                        if (session) foci.encop(session, {
                            int: "club",
                            action: "setmember",
                            
                            cuid: cuid,
                            uuid: uuid,
                            title: title,
                            is_admin: is_admin
                        }, function (suc, dat) {
                            member.find(".save-btn").removeClass("loading");
                            
                            if (suc) {
                                mem.is_admin = is_admin;
                                mem.title = title;
                                refresh();
                            } else {
                                util.emsg(dat);
                            }
                        });
                    });
                });
                
                member.find(".remove-btn").click(function () {
                    util.ask("Are you sure to REMOVE this member? This action is not reversible", function (ans) {
                        if (ans) {
                            login.session(function (session) {
                                foci.encop(session, {
                                    int: "club",
                                    action: "delmember",
                                    
                                    cuid: cuid,
                                    uuid: uuid
                                }, function (suc, dat) {
                                    if (suc) {
                                        update(false);
                                        util.emsg("removed", "warning");
                                    } else {
                                        util.emsg(dat);
                                    }
                                });
                            });
                        }
                    });
                });
            })();
                
            return member;
        }
        
        function sortMember(dat) {
            var res = [];
            
            var filt_id = function (id) {
                for (var k in dat) {
                    if (dat.hasOwnProperty(k)) {
                        if (dat[k] && (!id || dat[k][id])) {
                            dat[k].uuid = k;
                            res.push(dat[k]);
                            delete dat[k];
                        }
                    }
                }
            }
            
            filt_id("is_app");
            filt_id("is_creator");
            filt_id("is_admin");
            filt_id("");
            
            return res;
        }
        
        function loadAllMember(session) {
            main.removeClass("no-login");
            foci.encop(session, {
                int: "club",
                action: "member",
                cuid: cuid
            }, function (suc, dat) {
                if (suc) {
                    var self = dat[session.getUUID()];
                    
                    if (self) {
                        if (self.is_admin || self.is_creator)
                            main.addClass("admin");
                        
                        if (!self.is_app) {
                            main.find(".join-btn").remove();
                        }
                    } else {
                        main.find(".invite-btn").remove();
                    }
                    
                    var filt = sortMember(dat);
                    
                    for (var i = 0; i < filt.length; i++) {
                        main.find(".members").append(genMember(filt[i].uuid, filt[i], session));
                    }
                } else {
                    util.emsg(dat);
                }
            });
        }
    
        (function () {
            var search = local_search({ prompt: "Search member" });
        
            main.find(".login-link").click(function () {
                login.session(function (session) {
                    loadAllMember(session);
                });
            });
            
            main.find(".member-search").append(search);
            
            if (env.session()) {
                loadAllMember(env.session());
            } else {
                main.addClass("no-login");
            }
            
            var no_hide = false;
            
            var reqtext = popselect.text(main.find(".join-btn"), {
                prompt: "Comment(your identity and reason to join this club)",
            
                onSubmit: function (cb) {
                    no_hide = true;
                    
                    login.session(function (session) {
                        if (session)
                            foci.encop(session, {
                                int: "club",
                                action: "applyjoin",
                                cuid: cuid,
                                comment: reqtext.val()
                            }, function (suc, dat) {
                                no_hide = false;
                                
                                if (suc) {
                                    util.emsg("request sent", "success");
                                    reqtext.hide();
                                } else {
                                    util.emsg(dat);
                                }
                                
                                cb();
                            });
                        else no_hide = false;
                    });
                },
                
                onHide: function () {
                    return !no_hide;
                }
            });
            
            main.find(".invite-btn").click(function () {
                userhunt.modal([], function (selected) {
                    if (!selected.length) {
                        util.emsg("no user chosen", "info");
                        return;
                    }
                    
                    login.session(function (session) {
                        foci.encop(session, {
                            int: "club",
                            action: "invite",
                            cuid: cuid,
                            uuids: selected
                        }, function (suc, dat) {
                            if (suc) {
                                util.emsg("invitation sent", "success");
                            } else {
                                util.emsg(dat);
                            }
                        });
                    });
                }, {
                    use_dragi: config.use_dragi
                });
            });
        })();
    
        cont.append(main);
    
        var mod = {};
    
        return mod;
    };
    
    club.popview = function (config) {
        config = $.extend({
            use_dragi: false
        }, config);
    
        var main = $("<div class='com-club-popview ui small modal'> \
            <div class='pop-cont'> \
                <div class='local-search' style='padding-right: 1rem;'></div> \
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
        
        main.find(".local-search").append(local_search());
        
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
                if (parsed.state == foci.clubstat.review)
                    util.emsg("club not ready");
                else {
                    hide();
                    util.jump("#clubcent/" + info.cuid);
                }
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
