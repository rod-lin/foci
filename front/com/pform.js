/* page form */

"use strict";

define([ "com/util" ], function (util) {
    var $ = jQuery;
    foci.loadCSS("com/pform.css");

    function init(cont, forms, config) {
        cont = $(cont);
        config = $.extend({
            scroll: cont
        }, config);

        var main = $("<div class='com-pform'></div>");

        /*
            form {
                cont: "<html>",
                [onInit]
                [onShow]
                [onHide]
            }
         */
        function genPForm(form) {
            var dom = $("<div class='pform-page'><div class='pform-cont vcenter'></div></div>");
            var fcont = $(form.cont);

            fcont.css("display", "");

            dom.find(".pform-cont").append(fcont);
            form.dom = dom;

            return dom;
        }

        for (var i = 0; i < forms.length; i++) {
            var dom = genPForm(forms[i]);
            main.append(dom);
            dom.css("left", i * 100 + "%");
        }

        var cur_page = 0;

        function showCurPage() {
            var form = forms[cur_page];

            form.dom.addClass("show");

            if (!form.init) {
                form.init = true;
                if (form.onInit)
                    form.onInit();
            }

            if (form.onShow)
                form.onShow();
        }

        function hideCurPage() {
            var form = forms[cur_page];

            form.dom.removeClass("show");

            if (form.onHide)
                form.onHide();
        }

        function setOffset() {
            main.css("left", "-" + cur_page * 100 + "%");
        }

        function nextPage() {
            if (cur_page + 1 < forms.length) {
                hideCurPage();
                cur_page++;
                showCurPage();
                setOffset();
            }
        }

        function prevPage() {
            if (cur_page > 0) {
                hideCurPage();
                cur_page--;
                showCurPage();
                setOffset();
            }
        }

        cont.append(main);

        main.ready(function () {
            showCurPage();
        });

        // $(window).resize(function () {
        //     // main.find(".pform-page").css("line-height", cont.height() + "px");
        // }).resize();
        //
        // setTimeout(function () {
        //     nextPage();
        // }, 3000);
        //
        // setTimeout(function () {
        //     nextPage();
        // }, 6000);
        //
        // setTimeout(function () {
        //     prevPage();
        // }, 9000);

        var ret = {};

        ret.nextPage = function () {
            nextPage();
        };

        ret.background = function (val) {
            cont.css("background", val);
        };

        return ret;
    }

    return { init: init };
});
