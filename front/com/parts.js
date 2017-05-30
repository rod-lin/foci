/* parts */

"use strict";

define([ "com/util", "com/progress" ], function (util, progress) {
	var $ = jQuery;
	foci.loadCSS("com/parts.css");

	function init(cont, config) {
		cont = $(cont);
		config = $.extend({
			base: "sub"
		}, config);

		var main = $("<div class='com-parts'></div>");
		var prog = progress.init("body", { top: true, position: "fixed" });

		var cache = {};

		function fetch(url, suc, err) {
			$.ajax({
				type: "GET",
				url: url,
				success: function (dat) { suc(dat); },
				error: function (req, exc) {
					util.emsg("$front.com.parts.fail_get_url(" + url + "," + exc + ")");
					err();
				}
			});
		}

		function load(name, cb, args) {
			var next = function (text) {
				// var loader = $("<div class='ui active loader'></div>");
				prog.inc();

				var show = function (suc) {
					setTimeout(function () {
						main.addClass("show");

						if (suc) {
							prog.complete();
							setTimeout(prog.hide, 1000);
						} else {
							prog.err();
							setTimeout(prog.hide, 2000);
						}

						// loader.remove();
						if (cb) cb(!!suc);
					}, 300);
				};

				var part = $(text);
				main.html(part);

				cont.scrollTop(0);

				prog.inc();

				part.ready(function () {
					prog.inc();
					if (window.init) {
						window.init(part, args, show, cont);
					}
				});
			};

			main.removeClass("show");
			prog.show();

			if (cache.hasOwnProperty(name)) {
				next(cache[name]);
			} else {
				var url = config.base + "/" + name + ".html";
				fetch(url, next, function () {
					if (cb) cb(false);
					prog.err();
				});
			}
		}

		var hashchange = function () {
			var hash = window.location.hash.slice(1);
			var args;
			var name = "";

			if (hash.length) {
				var split = hash.split("/");
				name = split[0];
				args = split.slice(1);
			} else args = [ "" ];

			if (config.onJump) {
				if (config.onJump(name, args) === true)
					return; // no need to jump
			}

			if (!hash.length) return;

			load(name, null, args);
		};

		if (window.location.hash !== undefined) {
			util.nextTick(hashchange);
			$(window).on("hashchange", hashchange);
		}

		cont.append(main);

		return {
			load: load,
			refresh: hashchange
		};
	}

	return {
		init: init
	};
});
