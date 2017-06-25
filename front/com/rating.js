/* rating */

"use strict";

define([ "com/util" ], function (util) {
	foci.loadCSS("com/rating.css");

	function init(cont, rating, config) {
		cont = $(cont);
		config = $.extend({
			total: 5,
			max: 10,
			freeze: true
		}, config);

		var main = $("<div class='com-rating ui star rating' style='display: inline-block; margin: 0;' data-max-rating='" + config.total + "'></div>");

		cont.append(main);

		var ret = {
			set: function (r) {
				main.rating("set rating", Math.round(r / config.max * config.total));
			},

			get: function () {
				return main.rating("get rating") / config.total * config.max;
			}
		};

		main.ready(function () {
			main.rating({
				initialRating: Math.round(rating / config.max * config.total),
				maxRating: 5
			});

			if (config.freeze)
				main.rating("disable");
		});

		return ret;
	}

	return {
		init: init
	};
})
