/* tip */

"use strict";

define([ "com/util" ], function (util) {
	function init(cont, text, position, config) {
		cont = $(cont);
		config = $.extend({
			style: "black"
		}, config);

		cont.popup({
			content: text,
			position: position,
			on: "click",
			scrollContext: config.scroll,
			variation: config.style == "white" ? "" : "inverted",
			onHide: function () {
				setTimeout(function () {
					cont.popup("destroy");
				}, 500);
			}
		});

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
