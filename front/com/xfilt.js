/* xfilt */
"use strict";

define(function () {
	return function (str, config) {
		config = config || {};
		str = str
			   .replace(/\t/g, "    ")
			   .replace(/ /g, "&nbsp;")
			   .replace(/</g, "&lt;")
			   .replace(/>/g, "&gt;");

		if (!config.ignore_nl) {
			str = str.replace(/\n/g, "<br>");
		}

		return str;
	};
})
