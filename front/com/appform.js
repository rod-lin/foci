/* application form */

"use strict";

define([
    "com/util", "com/login", "com/loadmore",
    "com/formi", "com/avatar", "com/rating",
    "com/realname", "com/notice"
], function (util, login, loadmore, formi, avatar, rating, realname, notice) {
    var $ = jQuery;
    var appform = {};

    foci.loadCSS("com/appform.css");

    // a list of app objects
    // app {
    //     uuid, form, status, info, rating, realname
    // }
    // 
    // formi form {}
    appform.table = function (cont, euid, type, config) {
        cont = $(cont);
        config = $.extend({
            // event_info
            enable_rating: false
        }, config);

        var main = $("<div class='com-appform-main'> \
            <div class='option-bar-cont'> \
                <div class='option-bar'> \
                    <button class='option-btn accept-btn ui frameless basic positive icon button'> \
                        <i class='check icon'></i> \
                        <span class='lang' data-replace='$front.sub.appcent.accept'>Accept</span> \
                    </button> \
                    <button class='option-btn decline-btn ui frameless basic negative icon button'> \
                        <i class='cancel icon'></i> \
                        <span class='lang' data-replace='$front.sub.appcent.decline'>Decline</span> \
                    </button> \
                    <button class='option-btn notice-btn ui frameless basic blue icon button'> \
                        <i class='bell outline icon'></i> \
                        <span class='lang' data-replace='$front.sub.appcent.notice'>Notice</span> \
                    </button> \
                    <button class='only-staff rate-btn option-btn ui frameless basic yellow icon button'> \
                        <i class='empty star icon'></i> \
                        <span class='lang' data-replace='$front.sub.appcent.rate'>Rate</span> \
                    </button> \
                    <span class='option-prompt'>No applicants chosen</span> \
                </div> \
            </div> \
            <div class='main-table-cont'> \
                <span> \
                    <table class='ui celled padded unstackable table main-table'> \
                        <tbody></tbody> \
                    </table> \
                    <div class='float-header'></div> \
                </span> \
                <div class='load-bar'></div> \
            </div> \
        </div>");

        main.addClass("type-" + type);

        var table_cont = main.find(".main-table-cont");
        var main_table = main.find(".main-table");
        var thead = null;
        var tbody = main_table.find("tbody");
        var float_header = main.find(".float-header");
        var opt_bar_cont = main.find(".option-bar-cont");
        var load_bar = main.find(".load-bar");

        var accept_btn = main.find(".accept-btn");
        var decline_btn = main.find(".decline-btn");
        var notice_btn = main.find(".notice-btn");
        var rate_btn = main.find(".rate-btn");

        var checkall = $("<div class='ui fitted checkbox check-all-btn col-checkbox'> \
            <input type='checkbox'><label></label> \
        </div>");

        cont.append(main);

        var global_headers = [
            checkall,
        ].concat(config.enable_rating ? [
            "<span>Rating</span>",
        ] : [], [
            "<span class='lang col-status' data-replace='$front.sub.appcent.status'>Status</span>",
            "<span class='lang col-user' data-replace='$front.sub.appcent.user'>User</span>",
            "<span class='lang col-job' data-replace='$front.sub.appcent.apply_for'>Apply for</span>"
        ]);

        var init_header_count = global_headers.length;

        // refresh&sync the table
        function refreshFloatHeader() {
            var height = main_table.find("thead").height();
            var cloned = main_table.clone();

            // move checkall to the float header
            $(cloned.find("thead th")[0]).html(checkall);
            float_header.html(cloned);
            
            float_header.css("height", height + "px");

            updateFloatHeader();
        }

        // update pos/width only
        function updateFloatHeader() {
            float_header.css("width", main_table.width() + "px");
            opt_bar_cont.css("max-width", main_table.width() + "px");
        }

        function updateOptionBar() {
            var opt_height = opt_bar_cont.height();

            if (!main.hasClass("show-opt")) {
                opt_bar_cont.css("top", (- opt_height) + "px");
            } else {
                table_cont.css("padding-top", opt_height + "px");
                float_header.css("top", opt_height + "px");
            }
        }

        function showOptionBar() {
            if (main.hasClass("show-opt")) return;

            var opt_height = opt_bar_cont.height();

            opt_bar_cont.css("top", "0");

            main.addClass("show-opt");

            table_cont.css("padding-top", opt_height + "px");
            float_header.css("top", opt_height + "px");
        }

        function hideOptionBar() {
            if (!main.hasClass("show-opt")) return;

            var opt_height = opt_bar_cont.height();
            opt_bar_cont.css("top", (- opt_height) + "px");

            main.removeClass("show-opt");

            table_cont.css("padding-top", "0");
            float_header.css("top", "0");
        }

        // generate thead
        // form - formi form
        function genHeader(form) {
            var form = formi.genForm(util.json(form));
            var fields = form.fields;

            // form.fields

            // initial headers
            var headers = global_headers;
            
            for (var k in fields) {
                if (fields.hasOwnProperty(k)) {
                    var h = new String(fields[k].name);
                    h.iname = k;
                    headers.push(h);
                }
            }

            thead = $("<thead><tr></tr></thead>");
            var row = thead.find("tr");

            for (var i = 0; i < headers.length; i++) {
                var th = $("<th class='single line'></th>");
                th.append(headers[i]);
                row.append(th);
            }

            return thead;
        }

        // return td
        function genStatusToken(status) {
            var tok = $("<td class='status-token-cont center aligned collapsing'><div class='status-token'> \
                <i class='icon'></i><span class='val'></span> \
            </div></td>");
            
            switch (status) {
                case "accept":
                    tok.addClass("positive");
                    tok.find(".icon").removeClass("circle cancel check").addClass("check");
                    tok.find(".val").html("Accepted");
                    break;

                case "auto":
                    tok.addClass("positive");
                    tok.find(".icon").removeClass("circle cancel check").addClass("check");
                    tok.find(".val").html("Auto");
                    break;

                case "decline":
                    tok.addClass("negative");
                    tok.find(".icon").removeClass("circle cancel check").addClass("cancel");
                    tok.find(".val").html("Declined");
                    break;

                default:
                    tok.addClass("pending");
                    tok.find(".icon").removeClass("circle cancel check").addClass("circle");
                    tok.find(".val").html("Pending");
            }

            return tok;
        }

        function genUser(appobj) {
            var td = $("<td class='center aligned collapsing'><div class='user-badge'> \
                <div class='avatar'></div> \
                <div class='info'> \
                    <div class='dname-cont'> \
                        <span class='realname'></span> \
                        <span class='dname'></span> \
                    </div> \
                    <div class='rating'></div> \
                </div> \
            </div></td>");

            var parsed = login.parseInfo(appobj.info);

            var realname_dom = realname.badge(appobj.uuid, euid, {
                use_given: true,
                data: appobj.realname
            });

            // alert(realname_dom.data("realname"));
            td.attr("data-realname", realname_dom.data("realname"));
            td.attr("data-dname", parsed.dname);
            td.attr("data-rating", appobj.info.rating);

            avatar.init(td.find(".avatar"), appobj.info, { size: "3em", popdir: "top left" });
            // alert(appobj.rating);
            rating.init(td.find(".rating"), appobj.info.rating);
            td.find(".realname").append(realname_dom);

            td.find(".dname").html(parsed.dname);

            return td;
        }

        // { uuid, form, status, info, rating, realname }
        function genItem(appobj) {
            // fill in the init headers
            var row = $("<tr></tr>");
            
            function wrap(cont, cls) {
                var td = $("<td></td>");
                td.append(cont);
                td.addClass(cls);
                return td;
            }

            var checkbox = $("<div class='ui fitted checkbox'> \
                <input type='checkbox'><label></label> \
            </div>");

            checkbox.checkbox();

            row.on("appform:select", function (ev, checked) {
                if (checked) {
                    checkbox.checkbox("check");
                    row.addClass("selected");
                } else {
                    checkbox.checkbox("uncheck");
                    row.removeClass("selected");
                }
            });

            row.add(checkbox).click(function () {
                checkbox.checkbox("toggle");
                row.trigger("appform:select", [ checkbox.checkbox("is checked") ]);
            });

            var status_tok = genStatusToken(appobj.status);

            var cls = "center aligned collapsing";
            row.append(wrap(checkbox, cls).addClass("col-checkbox"));

            if (config.enable_rating) {
                var val = "<span class='rating-val'>" +
                          (appobj.rating ? appobj.rating.rating : "-") +
                          "</span>/10";
                row.append(wrap(val, cls).addClass("col-rating"));

                if (appobj.rating)
                    row.addClass("rated");
            }

            row.append(genStatusToken(appobj.status).addClass("col-status"));
            row.append(genUser(appobj).addClass("col-user"));
            row.append(wrap(type === "staff" ? "Staff" : "Participant", cls).addClass("col-job"));

            // fill in rest of the form

            if (appobj.status !== "pending")
                row.addClass("determined");
            
            var rest = global_headers.slice(init_header_count);

            for (var i = 0; i < rest.length; i++) {
                var name = rest[i].iname;

                if (appobj.form && appobj.form.hasOwnProperty(name)) {
                    var val = appobj.form[name].val;
                    if (val && val.hasOwnProperty("dval")) val = val.dval; // replace with display value
                    row.append(wrap(val));
                } else {
                    row.append(wrap("N/A"));
                }
            }

            return row;
        }

        var appendItem, getSelectedUUID, getSelectedDOM,
            changeItemStatus, selectedDeterminedApp, getDNames,
            changeItemRating, countSelectedRow;
        
        (function () {
            var allselect = checkall;
            var allrow = $();
            var allapp = {};
            var selected = [];

            allselect.checkbox("uncheck");

            function setOptionPrompt(count) {
                var prompt = (count >= 1 ? count : "No") + " applicant" + (count > 1 ? "s" : "") + " chosen";
                main.find(".option-prompt").html(prompt);
            }

            // real click
            allselect.click(function () {
                if (allrow.length === selected.length) {
                    allrow.trigger("appform:select", [false]);
                } else {
                    allrow.trigger("appform:select", [true]);
                }
            });

            appendItem = function (appobj) {
                var row = genItem(appobj);
                main_table.find("tbody").append(row);

                allrow = allrow.add(row);

                row.data("uuid", appobj.uuid);
                allapp[appobj.uuid] = appobj;

                row.on("appform:select", function (ev, checked) {
                    var found = selected.indexOf(row);

                    if (checked) {
                        if (found === -1) {
                            selected.push(row);
                        }
                    } else {
                        if (found !== -1) {
                            selected.splice(found, 1);
                        }
                    }

                    if (allrow.length === selected.length)
                        allselect.checkbox("check");
                    else
                        allselect.checkbox("uncheck");

                    if (selected.length) {
                        showOptionBar();
                    } else {
                        hideOptionBar();
                    }

                    setOptionPrompt(selected.length);
                });
            };

            getSelectedDOM = function () {
                return selected.slice();
            };

            getSelectedUUID = function (doms) {
                doms = doms || selected;
                var uuids = [];

                for (var i = 0; i < selected.length; i++) {
                    uuids.push(selected[i].data("uuid"));
                }

                return uuids;
            };

            // check if the selected list has determined applicants
            selectedDeterminedApp = function () {
                return !! $(selected).map($.fn.toArray).filter(".determined").length;
            };

            countSelectedRow = function (selector) {
                return $(selected).map($.fn.toArray).filter(selector).length;
            };

            changeItemStatus = function (doms, status) {
                for (var i = 0; i < doms.length; i++) {
                    doms[i].find(".status-token-cont").before(genStatusToken(status)).remove();

                    var uuid = doms[i].data("uuid");
                    allapp[uuid].status = status;

                    if (status !== "pending") {
                        doms[i].addClass("determined");
                    } else {
                        doms[i].removeClass("determined");
                    }
                }

                setTimeout(function () {
                    refreshFloatHeader();
                }, 100);
            };

            getDNames = function (uuids) {
                var names = [];

                for (var i = 0; i < uuids.length; i++) {
                    if (!allapp[uuids[i]].info.parsed)
                        allapp[uuids[i]].info.parsed = login.parseInfo(allapp[uuids[i]].info);

                    names.push(allapp[uuids[i]].info.parsed.dname);
                }

                return names;
            };
            
            changeItemRating = function (doms, rating) {
                for (var i = 0; i < doms.length; i++) {
                    var uuid = doms[i].data("uuid");
                    doms[i].addClass("rated").find(".rating-val").html(rating);
                    allapp[uuid].rating = { rating: rating };
                }
            };
        })();

        (function () {
            table_cont.scroll(function () {
                float_header.css("left", (- table_cont.scrollLeft()) + "px");
                load_bar.css("left", table_cont.scrollLeft() + "px");
            });

            $(window).resize(function () {
                setTimeout(function () {
                    updateFloatHeader();
                    updateOptionBar();
                }, 100);
            });

            function doChangeStatus(btn, status) {
                var next = function () {
                    btn.addClass("loading");
                    
                    var doms = getSelectedDOM();
                    var uuids = getSelectedUUID(doms);

                    login.session(function (session) {
                        foci.encop(session, {
                            int: "event",
                            action: "appstatus",
                            
                            euid: euid,
                            uuids: uuids,
                            type: type,
                            status: status
                        }, function (suc, dat) {
                            btn.removeClass("loading");

                            if (suc) {
                                changeItemStatus(doms, status);
                            } else {
                                util.emsg(dat);
                            }
                        });
                    });
                };

                if (selectedDeterminedApp()) {
                    util.ask("Some of the chosen users have already been accepted/rejected. Are you sure to overwrite the application status?",
                             function (ans) {
                                 if (ans) next();
                             });
                } else {
                    next();
                }
            }

            accept_btn.click(function () {
                doChangeStatus(accept_btn, "accept")
            });

            decline_btn.click(function () {
                doChangeStatus(decline_btn, "decline")
            });

            notice_btn.click(function () {
                var uuids = getSelectedUUID();
                var names = getDNames(uuids);
                var prompt = "To " + util.manynoun(names);

                notice.editor({
                    logo: config.event_info ? config.event_info.logo : undefined,
                    prompt: prompt,
                    onSend: function (info, cb) {
                        login.session(function (session) {
                            foci.encop(session, {
                                int: "notice",
                                action: "send",
                                type: "event",

                                sender: euid.toString(),
                                uuids: uuids,

                                title: info.title,
                                msg: info.msg
                            }, function (suc, dat) {
                                if (suc) {
                                    util.emsg("notice has been sent", "success");
                                } else {
                                    util.emsg(dat);
                                }

                                cb(suc);
                            });
                        });
                    }
                });
            });

            rating.popup(rate_btn, function (rate, cb) {
                if (!config.enable_rating) return;

                var doms = getSelectedDOM();
                var uuids = getSelectedUUID();
                
                var next = function () {
                    login.session(function (session) {
                        foci.encop(session, {
                            int: "user",
                            action: "ratestaff",
                            euid: euid,
                            uuids: uuids,
                            rating: rate
                        }, function (suc, dat) {
                            if (suc) {
                                // selected.each(function (i, dom) {
                                //     $(dom).find(".rating-val").html(rat + "/10");
                                //     $(dom).attr("data-hasrating", true);
                                // });

                                changeItemRating(doms, rate);
                            } else {
                                util.emsg(dat);
                            }

                            cb(suc);
                        });
                    });
                };
                
                if (countSelectedRow(".rated")) {
                    util.ask("You are overwriting some rating(s). Are you sure to continue?",
                            function (yes) {
                                if (yes) next();
                                else cb(true);
                            });
                } else next();
            });
        })();

        var loadMore = (function () {
            var init = false;
            var skip = 0;

            return function (cb) {
                login.session(function (session) {
                    foci.encop(session, {
                        int: "event",
                        action: "getappcom",
                        type: type,
                        euid: euid,

                        need_form: !init,
                        skip: skip
                    }, function (suc, dat) {
                        if (suc) {
                            // initialize
                            if (!init) {
                                main_table.prepend(genHeader(dat.form));
                                init = true;
                            }

                            // for (var j = 0; j < 10; j++) {
                            
                            for (var i = 0; i < dat.list.length; i++) {
                                appendItem(dat.list[i]);
                            }

                            skip += dat.list.length;

                            setTimeout(function () {
                                refreshFloatHeader();
                            }, 100);
                        } else {
                            util.emsg(dat);
                        }
    
                        cb(suc && dat.eol);
                    });
                });
            };
        })();

        var loader = loadmore.init(load_bar, "no more applicant", loadMore);
        loader.load();

        var mod = {};

        mod.getTable = function () {
            return main_table;
        };

        mod.getOutputTable = function () {
            var table = main_table.clone();

            // remove first col

            table.find("th").get(0).remove();
            table.find("th .col-user").parent("th")
                .before("<th>Realname</th>")
                .after("<th>Rating</th>");

            table.find("td.col-rating").each(function (i, dom) {
                dom = $(dom);
                var text = dom.text();
                dom.html(text.replace("/", " / "));
            });

            table.find("td.col-checkbox").remove();

            table.find("td.col-status").each(function (i, dom) {
                dom = $(dom);
                dom.html(dom.text());
            });

            table.find("td.col-user").each(function (i, dom) {
                dom = $(dom);

                dom.before($("<td></td>").html(dom.attr("data-realname")));
                dom.after($("<td></td>").html(dom.attr("data-rating")));
                dom.html(dom.attr("data-dname"));
            });

            main.append(table);

            return table;
        };

        return mod;
    };

    return appform;
});
