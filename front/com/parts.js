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

		function load(name, cb) {
			var next = function (text) {
				var part = $(text);
				main.html(part);

				// TODO: weird?
				if (window.init)
					window.init(part);
	
				if (cb) cb(true);
			};

			if (cache.hasOwnProperty(name)) {
				next(cache[name]);
			} else {
				var url = config.base + "/" + name + ".html";
				fetch(url, next, function () { if (cb) cb(false); });
			}
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
