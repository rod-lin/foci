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
		var main = $("<div></div>");
		cont.append(main);
		cont = main;

		main.css({
			position: "relative"
		});

		var child = cont.children();
		var width = 0;

		for (var i = 0; i < child.length; i++) {
			child[i] = $(child[i]);
		}

		var intact = false;

		function update() {
			if (!cont.is(":visible")) {
				return;
			}

			// if (intact) {
			// 	return;
			// }

			intact = true;

			/* side margin */
			var count = config.count + 1;
			var gap = config.gap;
			var left;

			if (child.length) width = child[0].width();
			else {
				cont.css("height", gap);
				return;
			}

			var cont_width = cont.width();
			count = Math.floor((cont_width - config.min_margin * 2) / width);

			if (count <= 0) count = 1;

			left = (cont_width - count * width - (count - 1) * gap) / 2;

			var ret = {
				left: left
			};

			// var top;
			// var max_top = 0;

			var heights = new Array(count);

			for (var i = 0; i < count; i++) {
				heights[i] = gap;
			}

			function findMinColumn() {
				var min = heights[0];
				var col = 0;

				for (var i = 1; i < count; i++) {
					if (heights[i] < min) {
						min = heights[i];
						col = i;
					}
				}

				return col;
			}

			function findMaxColumn() {
				var max = heights[0];
				var col = 0;

				for (var i = 1; i < count; i++) {
					if (heights[i] > max) {
						max = heights[i];
						col = i;
					}
				}

				return col;
			}

			function getLeft(col) {
				return left + col * (width + gap);
			}

			for (var i = 0; i < child.length; i++) {
				var col = findMinColumn();
				var top = heights[col];

				child[i].css({
					position: "absolute",
					display: "inline-block",
					left: getLeft(col) + "px",
					top: top + "px",
					margin: "0",
				});

				heights[col] += child[i].height() + gap;
			}

			cont.css("height", heights[findMaxColumn()]);

			if (config.onUpdate) config.onUpdate(ret);

			return ret;
		}

		function add(elem) {
			intact = false;
			elem = $(elem);

			elem.css("opacity", "0");

			child.push(elem);
			cont.append(elem);
		}

		var proc = null;
		$(window).resize(function () {
			if (proc) {
				clearTimeout(proc);
			}

			proc = setTimeout(function () {
				update();
				proc = null;
			}, 50);
		});

		update();

		return {
			update: update,
			add: add,
			clear: function () {
				intact = false;
				child = [];
				cont.html("");
			}
		};
	}

	return {
		init: init
	}
});
