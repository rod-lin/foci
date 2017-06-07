/* tip */

"use strict";

define([], function () {
	function init(cont, text, position, config) {
		cont = $(cont);
		config = $.extend({}, config);

		cont.popup({
			content: text,
			position: position,
			on: "click"
		});

		setTimeout(function () {
			cont.popup("show");
		}, 1000);

		var ret = {};

		return ret;
	}

	return { init: init };
});
