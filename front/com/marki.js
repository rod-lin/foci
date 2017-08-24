/* markdown editor */

"use strict";

define([
    "com/xfilt", "com/util", "com/tip",
    "com/login", "com/helper", "com/upload"
], function (xfilt, util, tip, login, helper, upload) {
    var $ = jQuery;
	foci.loadCSS("com/marki.css");

    function editor(cont, config) {
        cont = $(cont);
        config = $.extend({
            placeholder: "",
            use_rich: true,
            tab: "&nbsp;&nbsp;&nbsp;&nbsp;"
        }, config);

        var main = $("<div class='com-marki-editor split'> \
            <div style='position: relative; height: 100%;'> \
                <div class='editor-preview'></div> \
                <div class='editor-text'> \
                    " +
                    (config.use_rich
                        ? "<div class='editor-cont rich input-no-style markdown-body' contenteditable='true'></div>"
                        : "<textarea class='editor-cont input-no-style'></textarea>")
                    + " \
                </div> \
            </div> \
            <div class='editor-toolbar'> \
                <button class='input-no-style'><i class='header icon'></i> \
                <button class='input-no-style'><i class='bold icon'></i> \
                <button class='input-no-style'><i class='italic icon'></i></button> \
                <button class='input-no-style'><i class='strikethrough icon'></i></button> \
                <button class='input-no-style'><i class='linkify icon'></i></button> \
                <button class='input-no-style'><i class='image icon'></i></button> \
                <button class='input-no-style'><i class='not-ordered list icon'></i></button> \
                <button class='input-no-style'><i class='ordered list icon'></i></button> \
                <button class='input-no-style'><i class='align left icon'></i></button> \
                <button class='input-no-style'><i class='align center icon'></i></button> \
                <button class='input-no-style'><i class='align right icon'></i></button> \
                <button class='input-no-style'><i class='toggle-preview-btn wizard icon'></i></button> \
                <span data-tooltip='About Markdown' data-position='right center'> \
                    <i class='help circle icon' style='margin-right: 0;'></i> \
                </span> \
            </div> \
        </div>");

        function updatePreview() {
            if (!config.use_rich)
                main.find(".editor-preview").html(markdown.toHTML(main.find(".editor-cont").val()));
        }
        
        if (config.use_rich) {
            main.find(".toggle-preview-btn").parent().remove();
            main.removeClass("split");
            document.execCommand("StyleWithCSS", false, true);
        } else {
            main.addClass("split");
        }

        function refreshSize() {
            if (!config.use_rich) {
                if (main.width() <= 640) {
                    main.removeClass("split");
                } else {
                    main.addClass("split");
                }
            }
        }

        function bindTool(dom, before, after, cmd, cb) {
            $(dom).parent()[0].onclick = function (ev) {
                var area = main.find(".editor-cont");
                
                if (config.use_rich) {
                    if (cb) {
                        cb();
                    } else if (cmd) {
                        document.execCommand(cmd);
                        ev.preventDefault();
                    }
                } else {
                    util.insertTextarea(area, before + after, "before");
                    // util.insertTextarea(area, after, "after");
                    updatePreview();
                }
            };
        }

        bindTool(main.find(".bold.icon"), "**", "**", "bold");
        bindTool(main.find(".italic.icon"), "*", "*", "italic");
        bindTool(main.find(".strikethrough.icon"), "~~", "~~", "strikeThrough");
        
        bindTool(main.find(".header.icon"), null, null, null, function () {
            // console.log(document.queryCommandValue("fontSize"));
            var size = parseInt(document.queryCommandValue("fontSize"));
            // console.log(size);
            size = (size - 4 + 1) % 4 + 4;
            // console.log(size);
            document.execCommand("fontSize", false, size);
        });

        bindTool(main.find(".linkify.icon"), "[", "](https://)", null, function () {
            var url = window.prompt("Link", "");
        
            if (url) {
                document.execCommand("createLink", false, url);
            }
            
            return ; // TODO: fix this(lose focus)
            
            upload.field(function (url) {
                if (url) {
                    main.find(".editor-cont")[0].focus();
                    document.execCommand("createLink", false, url);
                }
            }, { title: "Link url", icon: "linkify" });
        });
        
        bindTool(main.find(".image.icon"), "![](https://", ")", null, function () {
            // document.execCommand("insertImage", false, window.prompt('图片URL:', ''));
            var url = window.prompt("Image url", "");
        
            if (url) {
                document.execCommand("insertImage", false, url);
            }
            
            return; // TODO: fix this(lose focus)
            
            upload.field(function (url) {
                if (url) {
                    main.find(".editor-cont")[0].focus();
                    document.execCommand("insertImage", false, url);
                }
            }, { title: "Image url", icon: "image" });
        });

        bindTool(main.find(".not-ordered.list.icon"), "* ", "", "InsertUnorderedList");
        bindTool(main.find(".ordered.list.icon"), "1. ", "", "InsertOrderedList");

        bindTool(main.find(".align.left.icon"), "", "", "JustifyLeft");
        bindTool(main.find(".align.center.icon"), "", "", "JustifyCenter");
        bindTool(main.find(".align.right.icon"), "", "", "JustifyRight");

        // tip.init(main.find(".help.icon"), "Markdown", "bottom center");
        // console.log(main.find("button"));
        // main.find("button").popup({
        //     onHide: function () {
        //         alert("wtf");
        //     }
        // });

        function helpClick() {
            main.find(".help.icon").off("click")
            ret.showHelp(function () {
                main.find(".help.icon").click(helpClick);
            });
        }

        main.find(".help.icon").click(helpClick);

        // main.find(".help.icon").popup({
        //     content: "About Markdown",
        //     position: "bottom center",
        //     hoverable: true,
        //     on: "click"
        // }).popup("show");

        main.find(".editor-cont").keydown(function (e) {
            if (e.which == 9) {
                if (config.use_rich)
                    document.execCommand("insertHtml", false, config.tab);
                else
                    util.insertTextarea(this, "\t", "replace");
                e.preventDefault();
            }
        }).keyup(function () {
            updatePreview();
            ret.removeWarning();
        }).attr("placeholder", config.placeholder);

        main.find(".toggle-preview-btn").click(function () {
            main.toggleClass("show-preview");
            $(this).toggleClass("wizard").toggleClass("code");
        });

        $(window).resize(function () {
            refreshSize();
        }).resize();

        cont.append(main);

        var ret = {};

        ret.refreshSize = refreshSize;
        ret.clear = function () {
            if (config.use_rich)
                main.find(".editor-cont").html("");
            else {
                main.find(".editor-cont").val("");
                updatePreview();
            }
            
            ret.removeWarning();
        };

        ret.val = function (text) {
            if (text === undefined) {
                if (config.use_rich)
                    return main.find(".editor-cont").html();
                else
                    return main.find(".editor-cont").val();
            } else {
                if (config.use_rich)
                    main.find(".editor-cont").html(text);
                else
                    main.find(".editor-cont").val(text);
                    
                updatePreview();
            }

            return ret;
        };

        ret.keyup = function (arg) {
            main.find(".editor-cont").keyup(arg);
            return ret;
        };

        ret.focus = function (arg) {
            main.find(".editor-cont").focus(arg);
            return ret;
        };

        ret.setWarning = function () {
            main.addClass("warning");
        };

        ret.removeWarning = function () {
            main.removeClass("warning");
        };

        ret.showHelp = function (cb) {
            login.session(function (session) {
                foci.encop(session, {
                    int: "notice",
                    action: "temp",
                    name: "markdown_edit",
                    args: [ session.getUUID() ]
                }, function (suc, dat) {
                    if (suc) {
                        helper.init(dat);
                    } else {
                        util.emsg(dat);
                    }
                    
                    cb();
                });
            });
        };

        return ret;
    }

    return { editor: editor };
});
