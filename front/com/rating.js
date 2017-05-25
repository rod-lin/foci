/* rating */

"use strict";

define([], function () {
	function init(cont, rating, config) {
		cont = $(cont);
		config = $.extend({
			total: 5,
			max: 10
		}, config);

		var main = $("<div class='ui star rating' style='display: inline-block; margin: 0;' data-max-rating='" + config.total + "'></div>");
	
		main.rating("disable");
		cont.append(main);

		return {
			set: function (r) {
				main.rating("set rating", r / config.max * config.total);
			}
		};
	}

	return {
		init: init
	};
})
