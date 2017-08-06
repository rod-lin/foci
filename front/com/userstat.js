/* user status */

"use strict";

define([ "com/env", "com/util", "com/login" ], function (env, util, login) {
    var $ = jQuery;
    foci.loadCSS("com/userstat.css");

    function init(cont, config) {
        cont = $(cont);
        config = $.extend({}, config);

        var main = $("<div class='com-userstat'> \
            <div class='login-stat'> \
                <div class='stat-item notice-item blue'> \
                    <i class='alarm outline icon'></i> \
                    <span class='stat-name'>Notice</span> \
                    <span class='stat-number'>2</span> \
                </div> \
                <div class='stat-item message-item yellow'> \
                    <i class='comments outline icon'></i> \
                    <span class='stat-name'>Messages</span> \
                    <span class='stat-number'>10</span> \
                </div> \
                <div class='stat-item app-item green'> \
                    <i class='open envelope outline icon'></i> \
                    <span class='stat-name'>Application</span> \
                    <span class='stat-number'>1</span> \
                </div> \
            </div> \
            <div class='no-login-page'> \
                <div class='vcenter'> \
                    <span class='logo'><span class='foci-logo'></span>Foci</span><br> \
                    <button class='ui basic blue button reg-btn'>Register</button> \
                    <button class='ui basic green button login-btn'>Login</button> \
                </div> \
            </div> \
            <div class='load-page'><div class='ui loader active'></div></div> \
        </div>");

        function refresh() {
            main.removeClass("nologin login");

            var session = env.session();

            if (session) {
                foci.encop(session, {
                    int: "notice",
                    action: "getall"
                }, function (suc, dat) {
                    if (suc) {
                        main.find(".notice-item .stat-number").html(dat.notice);
                        main.find(".message-item .stat-number").html(dat.pm);
                        main.find(".app-item .stat-number").html(dat.app);
                        main.addClass("login");
                    } else {
                        util.emsg(dat);
                    }
                });
            } else {
                main.addClass("nologin");
            }
        }

        main.find(".notice-item").click(function () {
            env.get("tbar").openNotice();
        });

        main.find(".message-item").click(function () {
            env.get("tbar").openPM();
        });

        main.find(".app-item").click(function () {
            util.jump("#profile//apply");

            if (env.session()) {
                foci.encop(env.session(), { int: "notice", action: "clearapp" },
                function (suc) {
                    if (!suc)
                        util.emsg(suc);
                });
            }
        });

        main.find(".reg-btn, .login-btn").click(function () {
            login.init(function () {
                refresh();
            });
        });

        cont.append(main);

        refresh();

        var ret = {};

        return ret;
    }

    return { init: init };
});
