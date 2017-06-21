/* close it */

"use strict";

define([ "com/util" ], function (util) {
	foci.loadCSS("com/closeit.css");

	function init(modal, config) {
		modal = $(modal);
		config = $.extend({}, config);

		var ret = {};

		return ret;
	}

	return { init: init };
});
