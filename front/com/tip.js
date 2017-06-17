/* tip */

"use strict";

define([], function () {
	function init(cont, text, position, config) {
		cont = $(cont);
		config = $.extend({}, config);

		cont.popup({
			content: text,
			position: position,
			on: "click",
			onHide: function () {
				setTimeout(function () {
					cont.popup("destroy");
				}, 500);
			}
		});

		setTimeout(function () {
			cont.popup("show");
		}, 500);

		var ret = {};

		return ret;
	}

	return { init: init };
});
