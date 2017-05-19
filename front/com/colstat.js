"use strict";

define([], function () {
	var $ = jQuery;

	function stat(url, config, cb) {
		config = $.extend({
			x: 0, y: 0,
			w: 1, h: 1
		}, config);

		var canv = $("<canvas></canvas>")[0];

		if (!canv.getContext || !Image) {
			cb(null);
			return;
		}

		var ctx = canv.getContext("2d");

		var img = new Image();
		img.src = url;
		img.onload = function () {
			ctx.drawImage(img, 0, 0);

			function rgb(r, g, b) {
				return (r << 16) + (g << 8) + b;
			}

			var w = canv.width, h = canv.height;
			var dat = ctx.getImageData(config.x * w, config.y * h, config.w * w, config.h * h);

			var sum = 0;

			var r = 128, g = 128, b = 128;

			for (var i = 0; i < dat.data.length; i += 4) {
				r = (r + dat.data[i]) / 2;
				g = (g + dat.data[i + 1]) / 2;
				b = (b + dat.data[i + 2]) / 2;
				// alert(dat.data[i] + ", " + dat.data[i + 1] + ", " + dat.data[i + 2] + ", " + rgb(dat.data[i], dat.data[i + 1], dat.data[i + 2]));
			}

			cb({
				average: [ r, g, b ]
			});
		};
	}

	return { stat: stat };
});
