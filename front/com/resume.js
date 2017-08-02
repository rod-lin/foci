/* resume */

"use strict";

define([ "com/util", "com/rating", "com/event", "com/lang" ],
function (util, rating, event, lang) {
    foci.loadCSS("com/resume.css");

    var m = lang.msg;

    function preview(cont, config) {
        cont = $(cont);
        config = $.extend({
            scroll: $("#part"),
            stickto: cont.parent()
        }, config);

        var main = $("<div class='com-resume-preview ui sticky'> \
            <div class='preview-cover'></div> \
            <div class='preview-cont'> \
                <div class='preview-title'>(loading)</div> \
                <div class='preview-details'> \
                    <div class='preview-detail'> \
                        <i class='male icon'></i> \
                        <span class='name'>Job</span> \
                        <span class='val info-job'>--</span> \
                    </div> \
                    <div class='preview-detail'> \
                        <i class='wait icon'></i> \
                        <span class='name'>Duration</span> \
                        <span class='val info-date'>--</span> \
                    </div> \
                    <div class='preview-detail'> \
                        <i class='thumbs outline up icon'></i> \
                        <span class='name'>Rating</span> \
                        <span class='val info-rating'>--</span> \
                    </div> \
                </div><br> \
                <div class='preview-btns'> \
                    <button class='ui blue basic button about-btn'>About event</button> \
                </div> \
            </div> \
        </div>");

        function setDom(resume, info, parsed) {
            parsed = parsed || event.parseInfo(info);

            main.find(".preview-title").html(parsed.title);
            util.bgimg(main.find(".preview-cover"), parsed.cover);

            switch (resume.job) {
                case "org":
                    main.find(".info-job").html(m("$nat.cap($core.word.org)"));
                    break;

                case "partic":
                    main.find(".info-job").html(m("$nat.cap($core.word.partic)"));
                    break;

                case "staff":
                    main.find(".info-job").html(m("$nat.cap($core.word.staff)"));
                    break;

                default:
                    main.find(".info-job").html(m("Unknown"));
            }

            main.find(".info-date").html(parsed.date);

            if (resume.job == "org" || resume.job == "staff") {
                var rat = $("<span></span>");
                rating.init(rat, parsed.rating);
                main.find(".info-rating").html(rat);
            } else main.find(".info-rating").html("N/A");

            main.find(".about-btn").click(function () {
                util.jump("#event/" + info.euid);
            });

            main.ready(function () {
                main.sticky("refresh");
            });
        }

        main.sticky({
            context: config.stickto,
            scrollContext: config.scroll
        });

        cont.append(main);

        var ret = {};

        ret.setResume = function (dat, info, parsed) {
            if (info) {
                setDom(dat, info, parsed);
            } else {
                foci.get("/event/info", { euid: dat.euid }, function (suc, info) {
                    if (suc) {
                        setDom(dat, info);
                    } else {
                        util.emsg(info);
                    }
                });
            }
        };

        return ret;
    }

    function init(cont, uuid, config) {
        cont = $(cont);
        config = $.extend({}, config);

        var main = $("<div class='com-resume'> \
            <div class='resume-list'></div \
            ><div class='resume-preview'> \
            </div> \
        </div>");

        function genItem(dat, i) {
            var item = $("<div class='resume-item'> \
                <div class='resume-cover'></div> \
                <div class='resume-prompt'></div> \
                <div class='resume-fixed'> \
                    <span class='resume-rating' style='font-size: 1rem;'></span> \
                    <i class='pin icon'></i> \
                </div> \
            </div>");

            // preview(main.find(".resume-preview"), {}, {});

            foci.get("/event/info", { euid: dat.euid }, function (suc, info) {
                if (suc) {
                    var parsed = event.parseInfo(info);

                    rating.init(item.find(".resume-rating"), parsed.rating);
                    util.bgimg(item.find(".resume-cover"), parsed.cover);

                    switch (dat.job) {
                        case "org":
                            item.find(".resume-prompt").html("<b>Organized</b> event " + info.title);
                            break;

                        case "partic":
                            item.find(".resume-prompt").html("<b>Participated</b> event " + info.title);
                            break;

                        case "staff":
                            item.find(".resume-prompt").html("<b>Volunteered</b> event " + info.title);
                            break;

                        default:
                            item.find(".resume-prompt").html("Unknown job in event " + info.title);
                    }

                    item.click(function () {
                        main.find(".selected").removeClass("selected");
                        item.addClass("selected");
                        prev.setResume(dat, info, parsed);
                    });

                    if (i == 0) item.click();
                } else {
                    util.emsg(info);
                }
            });

            return item;
        }

        foci.get("/user/resume", {
        	uuid: uuid
        }, function (suc, dat) {
            if (suc) {
                for (var i = 0; i < dat.length; i++) {
                    main.find(".resume-list").append(genItem(dat[i], i));
                }
            } else {
                util.emsg(dat);
            }
        });

        var prev = preview(main.find(".resume-preview"));

        cont.append(main);

        var ret = {};

        return ret;
    }

    return { init: init };
});
