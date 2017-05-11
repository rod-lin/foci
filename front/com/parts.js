/* parts */

"use strict";

define([ "com/util" ], function (util) {
	var $ = jQuery;
	foci.loadCSS("com/parts.css");

	function init(cont, config) {
		cont = $(cont);
		config = $.extend({
			base: "sub"
		}, config);

		var main = $("<div class='com-parts'></div>");
		var progress = $(" \
			<div class='ui top attached indicating progress'> \
				<div class='bar'></div> \
			</div> \
		");

		progress.progress({ percent: 0 });
		progress.css({
			"position": "fixed",
			"z-index": "10000",
			"border-radius": "0",
			"width": "100%",
			"opacity": "0",
			"transition": "opacity 0.3s",
			"height": "2px"
		});

		function incProg() {
			progress.progress("increment");
		}

		function completeProg() {
			progress.progress("complete");
		}

		function showProg() {
			progress.progress("reset");
			progress.css("opacity", "1");
		}

		function hideProg() {
			progress.css("opacity", "0");
		}

		function errProg() {
			progress
				.progress("complete")
				.progress("set error");
		}

		$("body").append(progress);

		var cache = {};

		function fetch(url, suc, err) {
			$.ajax({
				type: "GET",
				url: url,
				success: function (dat) { suc(dat); },
				error: function (req, err) {
					util.emsg("$front.com.parts.fail_get_url(" + url + "," + err + ")");
					err();
				}
			});
		}

		function load(name, cb, args) {
			var next = function (text) {
				// var loader = $("<div class='ui active loader'></div>");
				incProg();

				var show = function (suc) {
					main.removeClass("hide");

					if (suc) {
						completeProg();
						setTimeout(hideProg, 300);
					} else {
						errProg();
						setTimeout(hideProg, 2000);
					}

					// loader.remove();
					if (cb) cb(!!suc);
				};

				var part = $(text);
				main.html(part);

				cont.scrollTop(0);

				incProg();

				part.ready(function () {
					incProg();
					if (window.init) {
						window.init(part, args, show, cont);
					}
				});
			};

			main.addClass("hide");
			showProg();

			if (cache.hasOwnProperty(name)) {
				next(cache[name]);
			} else {
				var url = config.base + "/" + name + ".html";
				fetch(url, next, function () {
					if (cb) cb(false);
					errProg();
				});
			}
		}

		var hashchange = function () {
			var hash = window.location.hash.slice(1);

			if (config.onJump) {
				config.onJump(!!hash.length);
			}

			if (!hash.length) return;

			var split = hash.split("/");
			var name = split[0];
			var args = split.slice(1);

			load(name, null, args);
		};

		if (window.location.hash != undefined) {
			hashchange();
			$(window).on("hashchange", hashchange);
		}

		cont.append(main);

		return {
			load: load
		};
	}

	return {
		init: init
	};
});
