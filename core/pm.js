/* personal message */

"use strict";

var PMsg = function (config) {
	err.assert(config.sender, "$core.pm.no_sender");
	err.assert(config.msg, "$core.pm.no_msg");

	this.sender = config.sender;
	this.msg = config.msg;

	this.format = config.format || "text"; // text, html(need authoritation), markdown, etc.
	this.date = config.date || new Date();
};
