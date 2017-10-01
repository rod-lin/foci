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
    
    club.reviewInfo = function (info, config) {
        config = $.extend({}, config);
        
        var main = $("<div class='ui small modal com-club-review-info'> \
            <div class='header-info'> \
                <div class='logo'></div> \
                <div class='name-creator'> \
                    <div class='dname'></div> \
                    <div class='school'>School: <span class='school-field'></span></div> \
                    <div class='creator'>Creator: <a class='creator-link'>loading</a></div> \
                </div> \
            </div> \
            <div class='prompt'>Description</div> \
            <div class='descr'>no description</div> \
        </div>");
        
        var parsed = club.parseInfo(info);
        
        util.bgimg(main.find(".logo"), parsed.logo);
        main.find(".dname").html(parsed.dname);
        main.find(".school-field").html(parsed.school);
        main.find(".descr").html(parsed.descr);
        
        foci.get("/user/info", { uuid: info.creator }, function (suc, dat) {
            if (suc) {
                main.find(".creator-link")
                    .html(xfilt(dat.dname))
                    .attr("href", "#profile/" + info.creator)
                    .click(function () {
                        hide();
                    });
            } else {
                util.emsg(dat);
            }
        });
        
        function hide() {
            main.modal("hide");
        }
        
        main.modal("show");
        
        var mod = {}
        
        return mod;
    };
    
    // a list of clubs shown on the profile
    // TODO: not finished!!!
    club.list = function (cont, uid, config) {
        cont = $(cont);
        config = $.extend({
            max_count: 2,
            type: "user", // , "event", or "review"(init must be given)
            
            init: [],
            
            entry: {}, // entry config
            
            is_self: false,
            
            no_related_prompt: "no related club"
            // onMoreClick
        }, config);
    
        var main = $("<div class='com-club-list'> \
            <div class='empty-prompt'></div> \
        </div>");
        
        main.find(".empty-prompt").html(config.no_related_prompt);
        
        var selected = [];
        
        config.entry = $.extend({
            onSelect: function (cuid, is_selected) {
                if (is_selected) {
                    selected.push(cuid);
                } else {
                    var i = selected.indexOf(cuid);
                    
                    if (i != -1) {
                        selected.splice(i, 1);
                    }
                }
            }
        }, config.entry);
        
        function renderList(dat) {
            var min = dat.length > config.max_count ? config.max_count : dat.length;
            
            for (var i = 0; i < min; i++) {
                main.append(club.entry(dat[i], config.entry));
            }
            
            if (!i) {
                main.addClass("empty");
            }
            
            if (dat.length > config.max_count) {
                var more = club.entry(null, $.extend(config.entry, {
                    tool: {
                        icon: "ellipsis horizontal",
                        name: "more"
                    }
                }));
                
                main.append(more);
                
                more.click(function () {
                    if (config.onMoreClick)
                        config.onMoreClick();
                        
                    if (!config.is_self) {
                        club.popview({
                            visit_mode: true,
                            init: dat
                        });
                    }
                });
            }
        }
    
        if (config.type == "user") {
            foci.get("/club/related", { uuid: uid }, function (suc, dat) {
                if (suc) {
                    renderList(dat);
                } else {
                    util.emsg(dat);
                }
            });
        } else if (config.type == "event" ||
                   config.type == "review") {
            renderList(config.init);
        }
            
        cont.append(main);
    
        var mod = {};
        
        mod.getSelected = function () {
            return selected;
        };
        
        return mod;
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
                                <div class='field'> \
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
    
    // == club logo
    club.entry = function (info, config) {
        config = $.extend({
            tool: null, // { icon, name }
            // onClick
            onClick: function (info) {
                if (info.state == foci.clubstat.review ||
                    info.state == foci.clubstat.rejected) {
                    util.jump("#clubreg/" + info.cuid);
                } else {
                    util.jump("#clubcent/" + info.cuid);
                }
            },
            
            show_name: true,
            size: "5rem",
            radius: "5px",
            
            margin: null,
            
            select: false,
            review_mode: false,
            
            // onSelect(cuid)
        }, config);
        
        var entry = $("<div class='com-club-entry'> \
            <div class='club-logo'> \
                <div class='state-overlay'><i class='icon'></i></div> \
            </div> \
            <div class='club-name'></div> \
            <div class='delete-btn'><i class='fitted cancel icon'></i></div> \
            <div class='badge'><i class='fitted icon'></i></div> \
            <div class='checkbox'><i class='fitted check icon'></i></div> \
        </div>");
        
        entry.find(".club-logo").css("border-radius", config.radius);
        
        if (config.tool) {
            entry = $("<div class='com-club-entry'> \
                <div class='club-logo'><i class='" + config.tool.icon + " fitted icon'></i></div> \
                <div class='club-name'>" + config.tool.name + "</div> \
            </div>");
        }
        
        function setSize(size) {
            entry.css("width", size);
            entry.find(".club-logo").css("height", size).css("line-height", size);
        }
        
        setSize(config.size);
        
        if (!config.show_name) {
            entry.find(".club-name").remove();
        }
        
        if (config.margin) {
            entry.css("margin", config.margin);
        }
        
        if (config.tool) return entry;
        
        ///////////// settings end
        
        var parsed = club.parseInfo(info);
        
        var overlay = entry.find(".state-overlay");
        
        util.bgimg(entry.find(".club-logo"), parsed.logo);
        entry.find(".club-name").html(parsed.dname);
        
        entry.click(function () {
            if (config.onClick)
                config.onClick(info);
        });
        
        entry.find(".delete-btn").click(function (e) {
            if (parsed.state == foci.clubstat.review ||
                parsed.state == foci.clubstat.rejected) {
                util.ask("Are you sure to delete this club(under review/rejected)?", function (ans) {
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
            
            e.stopPropagation();
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
                
            case "app":
                entry.addClass("show-badge");
                entry.find(".badge").addClass("applt").attr("title", "Applicant");
                entry.find(".badge .icon").addClass("spinner");
                
                title_text += " - appliaction pending";
                
                break;
        }
        
        switch (parsed.state) {
            case foci.clubstat.rejected:
                entry.addClass("rejected");
                overlay.find(".icon").addClass("cancel");
                title_text += " - review failed";
                
                break;
            
            case foci.clubstat.review:
                if (!config.review_mode) {
                    entry.addClass("review");
                    overlay.find(".icon").addClass("wait");
                    title_text += " - under review";
                }
                
                break;
                
            case foci.clubstat.operate:
                entry.addClass("operate");
                break;
        }
        
        entry.club = {};
        
        if (config.select) {
            entry.addClass("select");
            
            entry.find(".checkbox").click(function (e) {
                entry.find(".checkbox").toggleClass("selected");
                
                if (config.onSelect)
                    config.onSelect(info.cuid, entry.club.isSelected());
                    
                e.stopPropagation();
            });
            
            entry.club.isSelected = function () {
                return entry.find(".checkbox").hasClass("selected");
            };
        }
        
        entry.attr("title", title_text);
        
        return entry;
    };
    
    club.popview = function (config) {
        config = $.extend({
            visit_mode: false, // visit mode: init with the given club list
            club_list: null,
            
            use_dragi: false
        }, config);
    
        var main = $("<div class='com-club-popview ui small modal'> \
            <div class='pop-cont'> \
                <div class='local-search' style='padding-right: 1rem;'></div> \
                <div class='club-list club-self-list'></div> \
                <div class='club-list club-find-list'></div> \
            </div> \
        </div>");
        
        var find_club_entry = club.entry(null, {
            tool: {
                icon: "search",
                name: "Find club"
            }
        });
        
        var add_club_entry = club.entry(null, {
            tool: {
                icon: "add",
                name: "New club"
            }
        });
        
        var return_entry = club.entry(null, {
            tool: {
                icon: "chevron left",
                name: "Back"
            }
        });
        
        main.find(".club-self-list").append(find_club_entry).append(add_club_entry);
        main.find(".club-find-list").append(return_entry);
        
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
        
        var all_club = [];
        
        function renderList(dat, list, is_self) {
            for (var i = 0; i < dat.length; i++) {
                var dom = club.entry(dat[i], {
                    onClick: function (info) {
                        hide();
                        
                        if (info.state == foci.clubstat.review ||
                            info.state == foci.clubstat.rejected)
                            util.jump("#clubreg/" + info.cuid);
                        else {
                            util.jump("#clubcent/" + info.cuid);
                        }
                    }
                });
                
                dom.attr("data-dname", dat[i].dname);
                
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
            return_entry.click(function () {
                mode = "normal";
                main.removeClass("find-mode");
                clearSearch();
            });
            
            function clearResult() {
                main.find(".club-find-list .com-club-entry ")
                    .not(return_entry)
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
            
            find_club_entry.click(function () {
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
            
            add_club_entry.click(function () {
                util.jump("#clubreg");
                hide();
            });
            
            function clearResult() {
                main.find(".club-self-list .com-club-entry ")
                    .not(add_club_entry).not(find_club_entry)
                    .remove();
            }
            
            main.find(".local-search").addClass("loading");
            
            if (config.visit_mode) {
                find_club_entry.remove();
                add_club_entry.remove();
                clearResult();
                renderList(config.init, ".club-self-list", true);
            } else {
                login.session(function (session) {
                    foci.encop(session, {
                        int: "club",
                        action: "getrelated"
                    }, function (suc, dat) {
                        main.find(".local-search").removeClass("loading");
                        
                        if (suc) {
                            clearResult();
                            
                            // console.log(dat);
                            renderList(dat, ".club-self-list", true);
                        } else {
                            util.emsg(dat);
                        }
                    });
                });
            }
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
