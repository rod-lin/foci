/* water fall */

"use strict";

define(function () {
	var $ = jQuery;
	function init(cont /* parent container */, config) {
		config = $.extend({
			gap: 20, /* px */
			count: 5, /* max column count */
			min_margin: 20
		}, config);

		cont = $(cont);
		var child = cont.children();
		var width = 0;

		for (var i = 0; i < child.length; i++) {
			child[i] = $(child[i]);
		}

		if (i) width = child[0].width();

		function update(from) {
			from = from || 0;

			/* side margin */
			var count = config.count + 1;
			var gap = config.gap;
			var left;

			do {
				count--;
				left = (cont.width() - count * width - (count - 1) * gap) / 2;
			} while (left < config.min_margin && count > 1);

			if (!count) return;

			var top;

			if (child.length) width = child[0].width();
			else return;

			for (var col = 0; col < count; col++) {
				top = gap;

				for (var i = col; i < child.length; i += count) {
					if (child[i]) {
						child[i].css({
							position: "absolute",
							left: left + "px",
							top: top + "px",
							margin: "0"
						});

						top += child[i].height() + gap;
					}
				}

				left += width + gap;
			}
		}

		function add(elem) {
			elem = $(elem);
			cont.append(elem);
			child.push(elem);
			update();
		}

		var proc = null;
		window.onresize = function () {
			if (proc) {
				clearTimeout(proc);
			}

			proc = setTimeout(function () {
				update();
				proc = null;
			}, 50);
		}

		update();

		return {
			update: update,
			add: add,
			clear: function () {
				child = [];
				cont.html("");
			}
		};
	}

	return {
		init: init
	}
});
