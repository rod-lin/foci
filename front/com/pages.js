/* pages */

"use strict";

define(function () {
	var $ = jQuery;

	function init(pg /* list of pages */, config) {
		config = $.extend({
			trans: 0.3 /* sec */
		}, config);

		function show(elem, cb) {
			elem.css({
				"opacity": "1",
				"pointer-events": "auto"
			});
		}

		function hide(elem, quick) {
			elem.css({
				"opacity": "0",
				"pointer-events": "none"
			});
		}

		for (var k in pg) {
			if (pg.hasOwnProperty(k)) {
				pg[k] = $(pg[k]).css("transition", "opacity " + config.trans + "s, height 0s " + config.trans + "s");
				hide(pg[k], true);
			}
		}

		var cur = null;

		if (config.init) {
			show(pg[cur = config.init], true);
		}

		var ret = {};

		ret.switch = function (name) {
			if (name == cur) return;
			if (cur) hide(pg[cur]);
			show(pg[name]);
			cur = name;
		};

		ret.toggle = function (p1, p2) {
			if (cur == p1) {
				ret.switch(p2);
				cur = p2;
			} else {
				ret.switch(p1);
				cur = p1;
			}
		};

		ret.cur = function () {
			return cur;
		};

		return ret;
	};

	return { init: init };
});
