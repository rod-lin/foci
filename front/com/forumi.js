/* foci forum */

"use strict";

define([
    "com/util", "com/login", "com/xfilt",
    "com/marki", "com/env"
], function (util, login, xfilt, marki, env) {
    var $ = jQuery;
    foci.loadCSS("com/forumi.css");
    
    var forumi = {};
    
    forumi.viewpost = function (cont, cuid, puid, config) {
        cont = $(cont);
        config = $.extend({
            load_more_prompt: "<a>load more</a>"
        }, config);
        
        var main = $("<div class='com-forumi-viewpost'> \
            <div class='ui loader active'></div> \
        </div>");
        
        cont.append(main);
        
        var mod = {};
        
        return mod;
    };
    
    forumi.newpost = function (cont, cuid, config) {
        cont = $(cont);
        config = $.extend({}, config);
        
        var main = $("<div class='com-forumi-newpost'> \
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
        
        parsed.title = xfilt(dat.title);
        parsed.ctime = new Date(dat.ctime);
        parsed.utime = new Date(dat.utime);
        
        parsed.tags = dat.tags || [];
        parsed.creator = dat.creator;
        parsed.comment_count = dat.comment_count || 0;
        
        return parsed;
    }
    
    forumi.preview = function (cont, cuid, config) {
        cont = $(cont);
        config = $.extend({
            no_more_prompt: "no more post",
            load_more_prompt: "<a>load more</a>"
        }, config);
    
        var main = $("<div class='com-forumi-preview'> \
            <div class='main-preview'> \
                <div class='top-bar'> \
                    <div class='ui icon input'> \
                        <input class='prompt' type='text' placeholder='Search post'> \
                        <i class='search icon'></i> \
                    </div> \
                    <button class='ui basic green right floated button new-post-btn'>New</button> \
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
        
        function showPost() {
            main.addClass("show-post");
        }
        
        function hidePost() {
            main.removeClass("show-post");
        }
        
        function genPreview(dat) {
            var preview = $("<div class='post-preview'> \
                <div class='type-bar'> \
                    <i class='fitted talk outline icon'></i> \
                </div> \
                <div class='preview-cont'> \
                    <div class='preview-headline'> \
                        <span class='preview-title field-title'>loading</span> \
                    </div> \
                    <div class='preview-detail'> \
                        Created at <span class='preview-date field-ctime'></span>, \
                        By <a class='preview-creator field-creator'></a>, \
                        Updated at <span class='preview-date field-utime'></span> \
                    </div> \
                </div> \
                <div class='state-bar'> \
                    <i class='user outline icon'></i><span class='field-comment-count'></span> \
                </div> \
            </div>");
            
            var parsed_dat = parsePreview(dat);
            
            preview.find(".field-title").html(parsed_dat.title);
            preview.find(".field-ctime").html(util.localDate(parsed_dat.ctime));
            preview.find(".field-utime").html(util.localDate(parsed_dat.utime));
            
            for (var i = 0; i < parsed_dat.tags.length; i++) {
                preview.find(".preview-headline").append("<div class='preview-tag'>" +
                                                         xfilt(parsed_dat.tags[i]) + "</div>");
            }
            
            preview.find(".field-comment-count").html(parsed_dat.comment_count);
            
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
            forumi.newpost(main.find(".viewpost-cont"), cuid, null, {});
            showPost();
        });
        
        main.find(".return-btn").click(function () {
            hidePost();
        });
    
        var mod = {};
        
        var skip = 0;
        
        mod.refresh = function () {
            skip = 0;
            main.find(".post-set").html("");
            setBottomPrompt("");
            
            loader.addClass("active");
            
            login.session(function (session) {
                if (session) foci.encop(session, {
                    int: "forumi",
                    action: "getpost",
                    
                    cuid: cuid,
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
                        }
                    } else {
                        util.emsg(dat);
                    }
                });
            });
        };
    
        return mod;
    };
    
    return forumi;
});
