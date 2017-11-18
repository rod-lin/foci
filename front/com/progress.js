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

		// using sigmoid func
		// (1 / (1 + e^-x)) - 1
		// value (0-100)
		// value / 200
		// y = (1 / (1 + e^-x)) - 0.5
		// 1 / (y + 0.5) = 1 + e^-x
		// e^-x = 1 / (y + 0.5) - 1
		// x = -ln(1 / (y + 0.5) - 1)
		ret.fakeinc = function (max, delta) {
			delta = delta || 0.01;
			max = max || 85;

			var r = max / 100;

			var val = main.progress("get value");

			var y = val / (200 * r);
			var x = -Math.log(1 / (y + 0.5) - 1)

			x = x + delta;
			y = 1 / (1 + Math.exp(-x)) - 0.5;

			val = y * (200 * r);
			
			main.progress("set progress", val);
		};

		ret.set = function (perc) {
			main.progress("set progress", perc);
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
