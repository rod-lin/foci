/* tip */

"use strict";

define([ "com/util" ], function (util) {
	function init(cont, text, position, config) {
		cont = $(cont);
		config = $.extend({
			style: "black",
			auto: true,
			distanceAway: 0,
			on: "click"
		}, config);

		var hidden = false;

		cont.popup({
			content: text,
			position: position,
			lastResort: true,
			on: config.on,
			scrollContext: config.scroll,
			distanceAway: config.distanceAway,
			variation: config.style == "white" ? "" : "inverted",
			
			onHide: function () {
				if (config.auto)
					setTimeout(function () {
						cont.popup("destroy");
					}, 500);
			}
		});

		if (config.auto) {
			setTimeout(function () {
				if (!hidden)
					cont.popup("show");
			}, 500);
		}

		util.wheel(function () {
			cont.popup("hide");
		});

		if (config.scroll)
			$(config.scroll).scroll(function () {
				cont.popup("hide");
			});

		var ret = {};
		
		ret.hide = function () {
			cont.popup("hide");
			hidden = true;
		};

		return ret;
	}

	return { init: init };
});
