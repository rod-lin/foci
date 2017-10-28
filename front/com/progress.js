/* progress */

"use strict";

define([ "com/util" ], function (util) {
	foci.loadCSS("com/progress.css");

	function init(cont, config) {
		cont = $(cont);
		config = $.extend({
			top: false,
			max_inc: 80,
			position: "absolute",
			prepend: false,
			height: 2,
			color: ""
		}, config);

		var main = $(" \
			<div class='com-progress ui top attached " + config.color + " progress'> \
				<div class='bar'></div> \
			</div> \
		");

		main.progress({ percent: 0, total: 100 });
		main.css("position", config.position);
		main.css("height", config.height + "px");

		if (config.top) {
			main.css("z-index", "10000");
		}

		if (config.prepend)
			cont.prepend(main);
		else
			cont.append(main);

		var ret = {};

		ret.fakeinc = function (max, k, i) {
			k = k || 10000;
			i = i || 0.25;
			max = max || 85;

			var val = main.progress("get value");

			var curx = (k * max) / (max - val);
			curx = curx + i;
			
			var newx = (max * curx) / (k + curx);
			
			main.progress("set progress", newx);
		};

		ret.inc = function () {
			var val = main.progress("get value");
			var inc = util.random(10, 30);

			if (inc + val > config.max_inc) {
				main.progress("set progress", config.max_inc);
			} else {
				main.progress("increment", inc);
			}
		};

		ret.sinc = function () {
			var val = main.progress("get value");
			var inc = util.random(5, 15);

			if (inc + val > config.max_inc) {
				main.progress("set progress", config.max_inc);
			} else {
				main.progress("increment", inc);
			}
		};

		ret.complete = function () {
			main.progress("complete");
		};

		ret.show = function () {
			main.progress("reset");
			main.css("opacity", "1");
		};

		ret.hide = function () {
			main.css("opacity", "0");

			setTimeout(function () {
				main.progress("reset");
			}, 300);
		};

		ret.err = function () {
			main.progress("complete")
				.progress("set error");
		};
		
		ret.dom = main;

		return ret;
	}

	return { init: init };
});
