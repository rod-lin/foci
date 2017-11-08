/* sort panel */

"use strict";

define([ "com/util", "com/lang" ], function (util, lang) {
	foci.loadCSS("com/sortby.css");

	function init(cont, cond, config) {
		cont = $(cont);
		config = $.extend({
			extra_util_btn: []
		}, config);

		var main = $("<div class='com-sortby'><div class='cond-set'></div></div>");
		var cond_set = main.find(".cond-set");

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

		// conf { cont, onClick(util) }
		function appendBtn(conf) {
			var btn = $("<div class='btn'> \
				<span class='cont'></span> \
				<div class='ui tiny loader active'></div> \
			</div>");
			
			var cont = btn.find(".cont");

			cont.html(conf.cont);

			var btnutil = {};

			btnutil.setLoading = function (loading) {
				if (loading) {
					btn.addClass("loading");
				} else {
					btn.removeClass("loading");
				}
			};

			btn.click(function () {
				if (conf.onClick) {
					conf.onClick(btnutil);
				}
			});

			main.append(btn);

			return btn;
		}

		for (var k in cond) {
			if (cond.hasOwnProperty(k)) {
				cond_set.append(genCond(k, cond[k]));
			}
		}

		for (var i = 0; i < config.extra_util_btn.length; i++) {
			appendBtn(config.extra_util_btn[i]);
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
