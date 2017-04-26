/* water fall */

define(function () {
	function init(cont /* parent container */, config) {
		config = $.extend({
			gap: 10, /* px */
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

			do {
				count--;
				left = (cont.width() - count * width - (count - 1) * gap) / 2;
			} while (left < config.min_margin);

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

		update();
		window.onresize = update;

		return {
			update: update,
			add: add
		};
	}

	return {
		init: init
	}
});
