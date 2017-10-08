/* foci forum */

"use strict";

define([
    "com/util", "com/login", "com/xfilt",
    "com/marki", "com/env", "com/club",
    "com/editable"
], function (util, login, xfilt, marki, env, club, editable) {
    var $ = jQuery;
    foci.loadCSS("com/forumi.css");
    
    var forumi = {};
    
    function parseComment(dat) {
        var parsed = {};
        
        parsed.creator = dat.creator;
        parsed.ctime = new Date(dat.ctime);
        parsed.etime = new Date(dat.etime);
        parsed.type = dat.type || "normal";
        parsed.format = dat.format || "html";
        parsed.msg = markdown.toHTML(dat.msg) || "(empty message)";
        
        return parsed
    }
    
    function genJumpTag(type, uid) {
        return "<a class='jump-tag' data-jumptag-type='" + type + "' data-jumptag-uid='" + uid + "'>#" + uid + "</a>";
    }
    
    forumi.viewpost = function (cont, post_info, cuid, puid, config) {
        cont = $(cont);
        config = $.extend({
            load_more_prompt: "<a>load more</a>",
            
            scroll: cont,
            topOffset: 0
        }, config);
        
        var main = $("<div class='com-forumi-viewpost com-forumi-comment'> \
            <div class='post-headline'> \
                <div class='post-headline-left'> \
                    <div style='margin-bottom: 0.5rem;'> \
                        <span class='post-title'>loading</span> \
                        <button class='ui frameless button edit-title-btn post-creator-only'><i class='fitted edit icon'></i></button> \
                    </div> \
                    <div class='post-detail'>Created <span class='created-time'></span></div> \
                    <div class='post-detail'>By <a class='creator-name'>loading</a></div> \
                </div> \
                <div class='post-headline-right'> \
                     \
                </div> \
            </div> \
            <div class='comment-set'></div> \
            <div class='show-more'><button class='ui fitted button show-more-btn'><i class='chevron down icon'></i>Show more</button></div> \
            <div class='comment-box send-box'> \
                <div class='avatar-cont'> \
                    <div class='avatar'></div> \
                </div> \
                <div class='msg-box'> \
                    <div class='msg-header' style='font-weight: bold;'>New comment</div> \
                    <div class='msg-cont'></div> \
                    <div class='msg-toolbar'> \
                        <button class='ui basic green button post-btn'>Post</button> \
                    </div> \
                </div> \
            </div> \
        </div>");
        
        function jumpToDom(dom, no_anim) {
            dom = $(dom);
            config.scroll.scrollTop(dom.offset().top
                                    + config.scroll.scrollTop()
                                    - config.topOffset - 14);
            
            if (!no_anim)
                dom.transition("tada");
        }
        
        function renderJumpTag(dom) {
            $(dom).find(".jump-tag").each(function (i, dom) {
                dom = $(dom);
                var type = dom.data("jumptag-type");
                var uid = dom.data("jumptag-uid");
                
                switch (type) {
                    case "comment":
                        dom.click(function () {
                            jumpToDom(".comment-id-" + uid);
                        });
                        
                        break;
                }
            });
        }
        
        function genLoader() {
            return $("<div class='ui inline loader active'></div>");
        }
        
        function genComment(dat, comment_id) {
            var comm = $("<div class='comment-box comment-id-" + comment_id + "'> \
                <div class='avatar-cont'> \
                    <div class='avatar'></div> \
                </div> \
                <div class='msg-box'> \
                    <div class='msg-header'> \
                        <span class='creator-name'>loading</span> \
                        <span class='creator-badge'></span> \
                    </div> \
                    <div class='msg-cont'></div> \
                    <div class='msg-toolbar'> \
                        <span class='msg-detail'></span> \
                        <div class='msg-toolbar-btns'> \
                            <button class='ui frameless icon button reply-btn'><i class='reply icon'></i></button> \
                            <button class='ui frameless icon button edit-btn'><i class='edit icon'></i></button> \
                        </div> \
                    </div> \
                </div> \
            </div>");
            
            var parsed = parseComment(dat);
            
            // comm.find(".msg-header").html(genCommentHeader(parsed));
            comm.find(".msg-cont").html(parsed.msg);
            renderJumpTag(comm.find(".msg-cont"));
            
            comm.find(".msg-detail").html("Issued at " + util.localDate(parsed.ctime));
            
            var editor = null;
            
            comm.find(".reply-btn").click(function () {
                send_box.append("Reply to " + genJumpTag("comment", comment_id) + ":&nbsp;").focus();
                jumpToDom(main.find(".send-box"));
            });
            
            comm.find(".edit-btn").click(function () {
                if (comm.find(".msg-cont").hasClass("editing")) {
                    comm.find(".edit-btn").addClass("loading");
                    
                    login.session(function (session) {
                        var val = editor.val();
                        
                        if (session) foci.encop(session, {
                                int: "forumi",
                                action: "editcomment",
                                
                                cuid: cuid,
                                puid: puid,
                                comment: comment_id,
                                
                                msg: val
                            }, function (suc, dat) {
                                comm.find(".edit-btn").removeClass("loading");
                                
                                if (suc) {
                                    comm.find(".msg-cont").html(parsed.msg = val);
                                    renderJumpTag(comm.find(".msg-cont"));
                                    
                                    comm.find(".edit-btn .icon").toggleClass("edit check");
                                    comm.find(".msg-cont").removeClass("editing")
                                } else {
                                    util.emsg(dat);
                                }
                            });
                        else comm.find(".edit-btn").removeClass("loading");
                    });
                    
                    // comm.find(".edit-btn").removeClass("loading");
                    // comm.find(".edit-btn .icon").toggleClass("edit check");
                } else {
                    comm.find(".msg-cont").html("").addClass("editing");
                    editor = marki.editor(comm.find(".msg-cont"));
                    
                    editor.val(parsed.msg);
                
                    comm.find(".edit-btn .icon").toggleClass("edit check");
                }
            });
            
            comm.find(".avatar").click(function () {
                util.jump("#profile/" + parsed.creator);
            });
            
            foci.get("/user/info", { uuid: parsed.creator }, function (suc, dat) {
                if (suc) {
                    var info = login.parseInfo(dat);
                    
                    comm.find(".creator-name").html(info.dname).click(function () {
                        util.jump("#profile/" + info.uuid);
                    });
                    
                    util.bgimg(comm.find(".avatar"), info.avatar);
                } else {
                    util.emsg(dat);
                }
            });
            
            // get relation to club
            login.session(function (session) {
                if (session) foci.encop(session, {
                    int: "club",
                    action: "onemember",
                    
                    cuid: cuid,
                    uuid: parsed.creator
                }, function (suc, dat) {
                    if (suc) {
                        var badges = club.genBadge(parsed.creator, dat);
                        
                        for (var i = 0; i < badges.length; i++) {
                            comm.find(".creator-badge").append(badges[i]);
                        }
                    } else {
                        util.emsg(dat);
                    }
                })
            });
            
            return comm;
        }
        
        function setPreviewDom() {
            var parsed = parsePreview(post_info);
            
            main.find(".post-title").html(parsed.title);
            main.find(".created-time").html(util.localDate(parsed.ctime));
            
            main.find(".creator-name").attr("href", "#profile/" + parsed.creator);
            
            foci.get("/user/info", { uuid: parsed.creator }, function (suc, dat) {
                if (suc) {
                    var info = login.parseInfo(dat);
                    main.find(".creator-name").html(info.dname);
                } else {
                    util.emsg(dat);
                }
            });
            
            main.find(".show-more-btn").click(function () {
                main.find(".show-more-btn").addClass("loading");
                
                mod.loadMore(function () {
                    main.find(".show-more-btn").removeClass("loading");
                });
            });
            
            var title_editor = editable.init(main.find(".post-title"), null, { explicit: true });
            title_editor.enable(false);
            
            login.session(function (session) {
                if (session) {
                    if (session.getUUID() == post_info.creator) {
                        main.addClass("post-is-creator");
                    }
                }
            });
            
            main.find(".edit-title-btn").click(function () {
                if (title_editor.enable()) {
                    main.find(".edit-title-btn").addClass("loading");
                    
                    var ntitle = main.find(".post-title").text() || "(no title)";
                    main.find(".post-title").text(ntitle);
                    
                    login.session(function (session) {
                        if (session) foci.encop(session, {
                            int: "forumi",
                            action: "editpost",
                            
                            cuid: cuid,
                            puid: puid,
                            
                            title: ntitle
                        }, function (suc, dat) {
                            main.find(".edit-title-btn").removeClass("loading");
                            
                            if (suc) {
                                title_editor.enable(false);
                            } else {
                                util.emsg(dat);
                            }
                        });
                    });
                } else {
                    title_editor.enable(true);
                }
                
                main.find(".edit-title-btn .icon").toggleClass("edit check");
            });
        }
        
        var send_box;
        
        function initSendBox() {
            send_box = marki.editor(main.find(".send-box .msg-cont"));
            
            env.user(function (info) {
                if (!info) {
                    util.emsg("send box not initialized");
                    return;
                }
                
                var parsed = login.parseInfo(info);
                
                util.bgimg(main.find(".send-box .avatar"), parsed.avatar);
                
                main.find(".send-box .post-btn").click(function () {
                    main.find(".send-box .post-btn").addClass("loading");
                    
                    login.session(function (session) {
                        if (session) foci.encop(session, {
                            int: "forumi",
                            action: "newcomment",
                            
                            cuid: cuid,
                            puid: puid,
                            
                            msg: send_box.val()
                        }, function (suc, dat) {
                            main.find(".send-box .post-btn").removeClass("loading");
                            
                            if (suc) {
                                util.emsg("posted", "success");
                                mod.refresh();
                            } else {
                                util.emsg(dat);
                            }
                        });
                    });
                });
            });
        }
        
        var mod = (function () {
            var mod = {};

            var cur_skip = 0;
            
            mod.loadMore = function (cb) {
                login.session(function (session) {
                    if (session) foci.encop(session, {
                            int: "forumi",
                            action: "getcomment",
                            
                            puid: puid,
                            cuid: cuid,
                            skip: cur_skip
                        }, function (suc, dat) {
                            if (suc) {
                                cur_skip += dat.length;
                                
                                for (var i = 0; i < dat.length; i++) {
                                    main.find(".comment-set").append(genComment(dat[i], i));
                                }
                                
                                if (!i) {
                                    main.find(".comment-set").addClass("no-more");
                                } else {
                                    main.find(".comment-set").removeClass("no-more");
                                }
                            } else {
                                util.emsg(dat);
                            }
                            
                            if (cb) cb(suc);
                        });
                    else if (cb) cb(false);
                });
            };
            
            mod.refresh = function () {
                var loader = genLoader();
                
                main.find(".comment-set").addClass("no-more");
                
                cur_skip = 0;
                
                main.find(".comment-set").html(loader);
                
                setPreviewDom();
                mod.loadMore(function () {
                    loader.remove();
                });
            };
            
            return mod;
        })();
        
        initSendBox();
        mod.refresh();
    
        cont.append(main);
        
        return mod;
    };
    
    forumi.newpost = function (cont, cuid, config) {
        cont = $(cont);
        config = $.extend({
            // onPost
        }, config);
        
        var main = $("<div class='com-forumi-newpost com-forumi-comment'> \
            <div class='comment-box'> \
                <div class='avatar-cont'> \
                    <div class='avatar'></div> \
                </div> \
                <div class='msg-box'> \
                    <div class='msg-header' style='font-size: 1.3rem;'> \
                        <div class='ui fluid input'> \
                            <input class='np-field-title' placeholder='Title' style='font-weight: bold;'> \
                        </div> \
                    </div> \
                    <div class='msg-cont'></div> \
                    <div class='msg-toolbar'> \
                        <button class='ui basic green button post-btn'>Post</button> \
                    </div> \
                </div> \
            </div> \
        </div>");
        
        main.find(".msg-cont").css("height", "25rem");
        var editor = marki.editor(main.find(".msg-cont"), {
            placeholder: "Comment"
        });
        
        main.find(".avatar").click(function () {
            util.emsg("tada~", "info");
        });
        
        env.user(function (info) {
            var parsed = login.parseInfo(info);
            util.bgimg(main.find(".avatar"), parsed.avatar);
        });
        
        main.find(".post-btn").click(function () {
            main.find(".post-btn").addClass("loading");
            
            login.session(function (session) {
                if (session) foci.encop(session, {
                        int: "forumi",
                        action: "newpost",
                        
                        cuid: cuid,
                        
                        title: main.find(".np-field-title").val(),
                        
                        init: {
                            msg: editor.val()
                        }
                    }, function (suc, dat) {
                        main.find(".post-btn").removeClass("loading");
                        
                        if (suc) {
                            util.emsg("posted", "success");
                            
                            if (config.onPost)
                                config.onPost();
                        } else {
                            util.emsg(dat);
                        }
                    });
                else
                    main.find(".post-btn").removeClass("loading");
            });
        });
        
        cont.append(main);
        
        var mod = {};
        
        return mod;
    };
    
    function parsePreview(dat) {
        var parsed = {};
        
        parsed.title = dat.title ? xfilt(dat.title) : "(no title)";
        parsed.ctime = new Date(dat.ctime);
        parsed.utime = new Date(dat.utime);
        
        parsed.pinned = dat.pinned;
        
        parsed.tags = dat.tags || [];
        parsed.creator = dat.creator;
        parsed.comment_count = dat.comment_count || 0;
        parsed.partic_count = dat.partic_count || 0;
        
        return parsed;
    }
    
    forumi.preview = function (cont, cuid, config) {
        cont = $(cont);
        config = $.extend({
            no_more_prompt: "no more post",
            load_more_prompt: "<a>load more</a>",
            
            scroll: cont,
            topOffset: 0,
            
            // onJumpPost
            // onJumpBack
        }, config);
    
        var main = $("<div class='com-forumi-preview'> \
            <div class='main-preview'> \
                <div class='top-bar'> \
                    <div class='ui icon input local-search'> \
                        <input class='prompt' type='text' placeholder='Search post'> \
                        <i class='search icon'></i> \
                    </div> \
                    <div class='toolbar'> \
                        <button class='ui basic green button new-post-btn'>New Post</button> \
                    </div> \
                </div> \
                <div class='post-set'></div> \
                <div class='bottom-prompt'></div> \
                <div style='position: relative'> \
                    <div class='ui loader'></div> \
                </div> \
            </div> \
            <div class='viewpost'> \
                <div class='viewpost-toolbar'> \
                    <button class='ui basic button return-btn'>Back</button> \
                </div> \
                <div class='viewpost-cont'></div> \
            </div> \
        </div>");
        
        var loader = main.find(".ui.loader");
    
        cont.append(main);
        
        var orig_scroll;
        
        var on_post = false;
        
        function showPost() {
            if (on_post) return;
            on_post = true;
            
            main.find(".main-preview").transition("fade right out");
            
            orig_scroll = config.scroll.scrollTop();
            
            setTimeout(function () {
                config.scroll.scrollTop(cont.offset().top
                                        + config.scroll.scrollTop()
                                        - config.topOffset + 2);
                
                main.addClass("show-post");
                main.find(".viewpost").transition("fade left in");
            }, 100);
        }
        
        function hidePost() {
            if (!on_post) return;
            on_post = false;
            
            main.find(".viewpost").transition("fade left out");
            
            mod.refresh();
            
            setTimeout(function () {
                config.scroll.scrollTop(orig_scroll);
                
                main.removeClass("show-post");
                main.find(".main-preview").transition("fade right in");
            }, 100);
            
            if (config.onJumpBack) {
                config.onJumpBack();
            }
        }
        
        function addPinned(dom) {
            var last_pin = main.find(".post-set .post-preview.pinned").last();
            
            if (last_pin.length)
                last_pin.after(dom);
            else
                main.find(".post-set .post-preview").first().before(dom);
            
            setTimeout(function () {
                $(dom).transition("pulse");
            }, 100);
        }
        
        function removePinned(dom) {
            // dom has to be pinned
            main.find(".post-set .post-preview.pinned").last().after(dom);
            setTimeout(function () {
                $(dom).transition("pulse");
            }, 100);
        }
        
        function toPost(puid, dat) {
            main.find(".viewpost-cont").html("");
            
            var next = function (dat) {
                if (config.onJumpPost) {
                    config.onJumpPost(puid);
                }
                
                forumi.viewpost(main.find(".viewpost-cont"), dat, cuid, puid, {
                    scroll: config.scroll,
                    topOffset: config.topOffset
                });
                
                showPost();
            };
            
            if (dat) {
                next(dat);
            } else {
                login.session(function (session) {
                    if (session) foci.encop(session, {
                        int: "forumi",
                        action: "getonepost",
                        
                        cuid: cuid,
                        puid: puid
                    }, function (suc, dat) {
                        if (suc) {
                            next(dat);
                        } else {
                            util.emsg(dat);
                        }
                    });
                });
            }
        }
        
        function genPreview(dat) {
            var preview = $("<div class='post-preview'> \
                <div class='type-bar'> \
                    <i class='fitted talk outline icon'></i><br> \
                    <i class='pin-btn fitted pin outline icon'></i> \
                </div> \
                <div class='preview-cont'> \
                    <div class='preview-headline'> \
                        <span class='preview-title field-title'>loading</span> \
                    </div> \
                    <div class='preview-detail'> \
                        Created <span class='preview-date field-ctime'></span>, \
                        Updated <span class='preview-date field-utime'></span>, \
                        By <a class='preview-creator field-creator'></a> \
                    </div> \
                </div> \
                <div class='state-bar'> \
                    <i class='comments outline icon'></i><span class='field-comment-count'></span> \
                    <i class='user outline icon' style='margin-left: 0.5rem;'></i><span class='field-partic-count'></span> \
                </div> \
            </div>");
            
            var parsed_dat = parsePreview(dat);
            
            preview.find(".preview-title").click(function () {
                toPost(dat.puid, dat);
            });
            
            if (parsed_dat.pinned) {
                preview.addClass("pinned");
            }
            
            preview.find(".pin-btn").click(function (e) {
                e.stopPropagation();
                
                login.session(function (session) {
                    if (session) foci.encop(session, {
                        int: "forumi",
                        action: "pinpost",
                        
                        cuid: cuid,
                        puid: dat.puid,
                        
                        pinned: !parsed_dat.pinned + 0
                    }, function (suc, dat) {
                        if (suc) {
                            if (parsed_dat.pinned = !parsed_dat.pinned + 0) {
                                addPinned(preview);
                                preview.addClass("pinned");
                            } else {
                                removePinned(preview);
                                preview.removeClass("pinned");
                            }
                        } else {
                            util.emsg(dat);
                        }
                    });
                });
            });
            
            preview.find(".field-title").html(parsed_dat.title);
            preview.find(".field-ctime").html(util.localDate(parsed_dat.ctime));
            preview.find(".field-utime").html(util.localDate(parsed_dat.utime));
            
            for (var i = 0; i < parsed_dat.tags.length; i++) {
                preview.find(".preview-headline").append("<div class='preview-tag'>" +
                                                         xfilt(parsed_dat.tags[i]) + "</div>");
            }
            
            preview.find(".field-comment-count").html(parsed_dat.comment_count);
            preview.find(".field-partic-count").html(parsed_dat.partic_count);
            
            foci.get("/user/info", { uuid: parsed_dat.creator }, function (suc, dat) {
                if (suc) {
                     var parsed = login.parseInfo(dat);
                     
                     preview.find(".field-creator")
                            .html(parsed.dname)
                            .attr("href", "#profile/" + parsed_dat.creator);
                } else {
                    util.emsg(dat);
                }
            });
            
            return preview;
        }
    
        function setBottomPrompt(html) {
            main.find(".bottom-prompt").html(html);
        }
        
        main.find(".new-post-btn").click(function () {
            main.find(".viewpost-cont").html("");
            forumi.newpost(main.find(".viewpost-cont"), cuid, {
                onPost: function () {
                    hidePost();
                }
            });
            showPost();
        });
        
        main.find(".return-btn").click(function () {
            hidePost();
        });
        
        util.scrollBottom(config.scroll, 5, function () {
            mod.loadMore();
        });
    
        // init local search
        (function () {
            var search_handler = null;
            var input = main.find(".local-search input");
            
            input.keydown(function () {
                if (search_handler) clearTimeout(search_handler);
                
                search_handler = setTimeout(function () {
                    doSearch(input.val());
                }, 500);
            });
            
            function doSearch(kw) {
                main.find(".local-search").addClass("loading");
                
                cur_kw = kw;
                mod.refresh(function () {
                    main.find(".local-search").removeClass("loading");
                });
            }
        })();
    
        var mod = {};
        
        var skip = 0;
        var cur_kw = "";
        var no_more = false;
        
        mod.toPost = toPost;
        mod.toPreview = hidePost;
        
        mod.loadMore = function (cb) {
            if (no_more) return;
            
            loader.addClass("active");
            
            login.session(function (session) {
                if (session) foci.encop(session, {
                        int: "forumi",
                        action: "getpost",
                        
                        cuid: cuid,
                        
                        kw: cur_kw || "",
                        skip: skip,
                    }, function (suc, dat) {
                        loader.removeClass("active");
                        
                        if (suc) {
                            skip += dat.length;
                            
                            for (var i = 0; i < dat.length; i++) {
                                main.find(".post-set").append(genPreview(dat[i]));
                            }
                            
                            if (!i) {
                                setBottomPrompt(config.no_more_prompt);
                                no_more = true;
                            }
                        } else {
                            util.emsg(dat);
                        }
                        
                        if (cb) cb(suc);
                    });
                else if (cb) cb(false);
            });
        }
        
        var refresh_locked = false;
        
        mod.refresh = function (cb) {
            if (refresh_locked) {
                if (cb) cb();
                return;
            }
            
            refresh_locked = true;
            
            skip = 0;
            no_more = false;
            main.find(".post-set").html("");
            setBottomPrompt("");
            
            mod.loadMore(function () {
                refresh_locked = false;
                if (cb) cb();
            });
        };
    
        return mod;
    };
    
    return forumi;
});
