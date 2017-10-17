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
            stickto: cont.parent(),
            use_modal: false
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

            main.find(".about-btn").off("click").click(function () {
                util.jump("#event/" + info.euid);
                if (config.use_modal)
                    main.modal("hide");
            });

            main.ready(function () {
                if (!config.use_modal)
                    main.sticky("refresh");
            });
        }

        if (config.use_modal) {
            main.removeClass("sticky").addClass("ui small modal").css("border", "none");
            main.modal();
        } else {
            main.sticky({
                context: config.stickto,
                scrollContext: config.scroll
            });
            cont.append(main);
        }

        var ret = {};

        ret.setResume = function (dat, info, parsed) {
            if (config.use_modal)
                main.modal("show");
            
            if (info) {
                setDom(dat, info, parsed);
            } else {
                util.eventInfo(dat.euid, function (info) {
                    setDom(dat, info);
                });
            }
        };

        return ret;
    }

    function init(cont, uuid, config) {
        cont = $(cont);
        config = $.extend({
            scroll: "#part"
        }, config);

        var main = $("<div class='com-resume'> \
            <div class='resume-list'></div \
            ><div class='resume-preview'> \
            </div> \
        </div>");

        function genItem(dat, i) {
            var item = $("<div class='resume-item'> \
                <div class='resume-cover'></div> \
                <div class='resume-prompt'> \
                    <span class='resume-rating' style='font-size: 1rem;'><br></span> \
                </div> \
                <div class='resume-fixed'> \
                    <i class='expand icon detail-btn'></i> \
                </div> \
            </div>");

            // preview(main.find(".resume-preview"), {}, {});

            util.eventInfo(dat.euid, function (info) {
                var parsed = event.parseInfo(info);

                rating.init(item.find(".resume-rating"), parsed.rating);
                util.bgimg(item.find(".resume-cover"), parsed.cover);

                var prefix;

                switch (dat.job) {
                    case "org":
                        prefix = "<b>Organized</b> event ";
                        break;

                    case "partic":
                        prefix = "<b>Participated</b> event ";
                        break;

                    case "staff":
                        prefix = "<b>Volunteered</b> event ";
                        break;

                    default:
                        prefix = "Unknown job in event ";
                }
                
                item.find(".resume-prompt").prepend(prefix + parsed.title);

                item.click(function () {
                    main.find(".selected").removeClass("selected");
                    item.addClass("selected");
                    prev.setResume(dat, info, parsed);
                });

                if (util.windowWidth() > 640)
                    if (i == 0) item.click();
            });

            return item;
        }

        foci.get("/user/resume", {
        	uuid: uuid
        }, function (suc, dat) {
            if (suc) {
                if (!dat.length) {
                    main.addClass("empty");
                    main.prepend("<div class='resume-empty-prompt'>empty resume</div>");
                } else {
                    for (var i = 0; i < dat.length; i++) {
                        main.find(".resume-list").append(genItem(dat[i], i));
                    }
                }
            } else {
                util.emsg(dat);
            }
        });

        var prev = preview(main.find(".resume-preview"), {
            scroll: config.scroll,
            use_modal: util.windowWidth() <= 640
        });

        cont.append(main);

        var ret = {};

        return ret;
    }

    return { init: init };
});
