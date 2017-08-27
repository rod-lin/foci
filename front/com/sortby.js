/* sort panel */

"use strict";

define([ "com/util", "com/lang" ], function (util, lang) {
	foci.loadCSS("com/sortby.css");

	function init(cont, cond, config) {
		cont = $(cont);
		config = $.extend({}, config);

		var main = $("<div class='com-sortby'></div>");

		var sortby = {};

		function genCond(name, conf) {
			conf.name = conf.name || name;
			conf.init = conf.init || 1;

			function dir(n) {
				return n == 1 ? "up" : "down";
			}

			var cond = $("<div class='cond'><i class='caret " + dir(conf.init) + " icon'></i>" + conf.name + "</div>");
			lang.update(cond);

			cond.click(function () {
				if (sortby.hasOwnProperty(name) && sortby[name]) {
					if (sortby[name] == conf.init) {
						sortby[name] = -sortby[name];
					} else {
						cond.removeClass("selected");
						delete sortby[name];
					}
				} else {
					sortby[name] = conf.init;
					cond.addClass("selected");
				}

				cond.find(".icon").removeClass("up").removeClass("down").addClass(dir(sortby[name] || conf.init));

				if (config.onClick) config.onClick(sortby);
			});

			return cond;
		}

		for (var k in cond) {
			if (cond.hasOwnProperty(k)) {
				main.append(genCond(k, cond[k]));
			}
		}
		
		// TODO: temp fix!!!
		setTimeout(function () {
			cont.append(main);
		}, 1000);

		var ret = {
			get: function () {
				return sortby;
			},

			clear: function () {
				sortby = {};
				main.find(".cond").removeClass("selected");
			}
		};

		return ret;
	}

	return { init: init };
});
