/* markdown editor */

"use strict";

define([
    "com/xfilt", "com/util", "com/tip",
    "com/login", "com/helper"
], function (xfilt, util, tip, login, helper) {
    var $ = jQuery;
	foci.loadCSS("com/marki.css");

    function editor(cont, config) {
        cont = $(cont);
        config = $.extend({
            placeholder: ""
        }, config);

        var main = $("<div class='com-marki-editor split'> \
            <div class='editor-preview'></div> \
            <div class='editor-text'> \
                <textarea class='editor-cont input-no-style'></textarea> \
            </div> \
            <div class='editor-toolbar'> \
                <i class='bold icon'></i> \
                <i class='italic icon'></i> \
                <i class='strikethrough icon'></i> \
                <i class='linkify icon'></i> \
                <i class='image icon'></i> \
                <i class='not-ordered list icon'></i> \
                <i class='ordered list icon'></i> \
                <i class='toggle-preview-btn wizard icon'></i> \
                <span data-tooltip='About Markdown' data-position='right center'> \
                    <i class='help circle icon' style='margin-right: 0;'></i> \
                </span> \
            </div> \
        </div>");

        function updatePreview() {
            main.find(".editor-preview").html(markdown.toHTML(xfilt(main.find(".editor-cont").val(), {
                ignore_space: true, ignore_nl: true
            })));
        }

        function refreshSize() {
            if (main.width() <= 640) {
                main.removeClass("split");
            } else {
                main.addClass("split");
            }
        }

        function bindTool(dom, before, after) {
            $(dom).click(function () {
                var area = main.find(".editor-cont");
                util.insertTextarea(area, before, "before");
                util.insertTextarea(area, after, "after");
                updatePreview();
            });
        }

        bindTool(main.find(".bold.icon"), "**", "**");
        bindTool(main.find(".italic.icon"), "*", "*");
        bindTool(main.find(".strikethrough.icon"), "~~", "~~");

        bindTool(main.find(".linkify.icon"), "[", "](https://)");
        bindTool(main.find(".image.icon"), "![](https://", ")");

        bindTool(main.find(".not-ordered.list.icon"), "* ", "");
        bindTool(main.find(".ordered.list.icon"), "1. ", "");

        // tip.init(main.find(".help.icon"), "Markdown", "bottom center");
        // console.log(main.find("button"));
        // main.find("button").popup({
        //     onHide: function () {
        //         alert("wtf");
        //     }
        // });

        main.find(".help.icon").click(function () {
            ret.showHelp();
        });

        // main.find(".help.icon").popup({
        //     content: "About Markdown",
        //     position: "bottom center",
        //     hoverable: true,
        //     on: "click"
        // }).popup("show");

        main.find(".editor-cont").keydown(function (e) {
            if (e.which == 9) {
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
            main.find(".editor-cont").val("");
            updatePreview();
            ret.removeWarning();
        };

        ret.val = function (text) {
            if (text === undefined) {
                return main.find(".editor-cont").val();
            } else {
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

        ret.showHelp = function () {
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
                });
            });
        };

        return ret;
    }

    return { editor: editor };
});
