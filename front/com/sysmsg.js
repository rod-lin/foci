/* system message */

"use strict";

define([ "com/env", "com/holdon", "com/util" ], function (env, holdon, util) {
    var sysmsg = {};

    var has_init = false;

    sysmsg.init = function () {
        if (has_init) return;

        var tbar = env.get("tbar");

        var display = function (msg) {
            var show = function () {
                tbar.showMsg(msg.icon, msg.msg, msg.style);
            };

            if (msg.burn)
				util.localOnce("sysmsg-" + msg.id, show);
			else
				show();
        };

        holdon.reg("sysmsg", {
			proc: function (data) {
				// data { icon, msg, style, burn, ddl, id }
				display(data);
			}
		});

        foci.get("/sysmsg/dump", {}, function (suc, dat) {
            if (suc) {
				for (var i = 0; i < dat.length; i++) {
					display(dat[i]);
				}
            } else {
                util.emsg(dat);
            }
        });

        has_init = true;
    };

    return sysmsg;
});
