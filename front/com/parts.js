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

		var cache = {};

		function fetch(url, suc, err) {
			$.ajax({
				type: "GET",
				url: url,
				success: function (dat) { suc(dat); },
				error: function (req, err) {
					util.qmsg("failed to get url: " + url + ": " + err);
					err();
				}
			});
		}

		function load(name, cb, args) {
			var next = function (text) {
				var part = $(text);
				main.html(part);

				cont.scrollTop(0);

				// TODO: weird?
				if (window.init)
					window.init(part, args);
	
				if (cb) cb(true);
			};

			if (cache.hasOwnProperty(name)) {
				next(cache[name]);
			} else {
				var url = config.base + "/" + name + ".html";
				fetch(url, next, function () { if (cb) cb(false); });
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
