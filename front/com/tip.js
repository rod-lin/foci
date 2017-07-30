/* tip */

"use strict";

define([ "com/util" ], function (util) {
	function init(cont, text, position, config) {
		cont = $(cont);
		config = $.extend({
			style: "black",
			auto: true,
			on: "click"
		}, config);

		cont.popup({
			content: text,
			position: position,
			lastResort: true,
			on: config.on,
			scrollContext: config.scroll,
			variation: config.style == "white" ? "" : "inverted",
			onHide: function () {
				if (config.auto)
					setTimeout(function () {
						cont.popup("destroy");
					}, 500);
			}
		});

		if (config.auto)
			setTimeout(function () {
				cont.popup("show");
			}, 500);

		util.wheel(function () {
			cont.popup("hide");
		});

		if (config.scroll)
			$(config.scroll).scroll(function () {
				cont.popup("hide");
			});

		var ret = {};

		return ret;
	}

	return { init: init };
});
