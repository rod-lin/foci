/* xfilt */
"use strict";

define(function () {
	return function (str, config) {
		config = config || {};
		
		if (!config.ignore_space) {
			str = str
				   .replace(/\t/g, "    ")
				   .replace(/ /g, "&nbsp;")
		}
		
		str = str
			   .replace(/</g, "&lt;");

		if (!config.ignore_nl) {
			str = str.replace(/\n/g, "<br>");
		}

		return str;
	};
})
