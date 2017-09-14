/* rating */

"use strict";

define([ "com/util" ], function (util) {
	foci.loadCSS("com/rating.css");

	function init(cont, rating, config) {
		cont = $(cont);
		config = $.extend({
			total: 5,
			max: 10,
			freeze: true,
			size: ""
		}, config);

		var main = $("<div class='com-rating ui star " + config.size + " rating' \
						   style='display: inline-block; margin: 0;' \
						   data-content=''></div>");

		cont.append(main);

		var ret = {
			set: function (r) {
				main.rating("set rating", Math.round(r / config.max * config.total));
				main.attr("data-html", "<span class='com-rating-tip'>" + util.trimFloat(r, 2) + "</span>");
			},

			get: function () {
				return main.rating("get rating") / config.total * config.max;
			}
		};

		// main.ready(function () {
		main.rating({
			initialRating: rating ? Math.round(rating / config.max * config.total) : 0,
			maxRating: 5
		});

		if (config.freeze) {
			main.rating("disable");
			main.popup({
				content: (rating === undefined ? "N/A" : util.trimFloat(rating, 2)),
				position: "right center",
				hoverable: true,
				variation: "inverted"
			});
			
			// alert(rating === undefined ? "N/A" : util.trimFloat(rating, 2));
			main.attr("data-html", "<span class='com-rating-tip'>" + (rating === undefined ? "N/A" : util.trimFloat(rating, 2)) + "</span>");
		}
		
		// });

		return ret;
	}

	return {
		init: init
	};
})
