/* pages */

"use strict";

define(function () {
	var $ = jQuery;

	function init(pg /* list of pages */, config) {
		config = $.extend({
			trans: 0.3 /* sec */
		}, config);

		var onShow = config.onShow || {};

		function show(elem, cb) {
			elem.css({
				"opacity": "1",
				"pointer-events": ""
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
				var sele;
				var onShow = null;
				var onLoad = null;

				if (typeof pg[k] === "object") {
					sele = pg[k].page;
					onShow = pg[k].onShow;
					onLoad = pg[k].onLoad;
				} else {
					sele = pg[k];
				}

				pg[k] = {
					page: $(sele).css("transition", "opacity " + config.trans + "s, height 0s " + config.trans + "s"),
					onShow: onShow,
					onLoad: onLoad
				}

				hide(pg[k].page, true);
			}
		}

		var cur = null;

		var ret = {};

		ret.to = function (name) {
			if (name == cur) return;
			if (cur) hide(pg[cur].page);

			cur = name;

			var next = function () {
				show(pg[name].page);
				if (pg[name].onShow) pg[name].onShow();
			}

			// onLoad is called before the page is shown
			if (pg[name].onLoad) {
				pg[name].onLoad(next);
			} else {
				next();
			}
		};

		ret.toggle = function (p1, p2) {
			if (cur == p1) {
				ret.to(p2);
				cur = p2;
			} else {
				ret.to(p1);
				cur = p1;
			}
		};

		ret.cur = function () {
			return cur;
		};

		if (config.init) {
			ret.to(config.init);
		}

		return ret;
	};

	return { init: init };
});
