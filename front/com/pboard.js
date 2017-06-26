/* picture board */

"use strict";

define([ "com/util" ], function (util) {
	foci.loadCSS("com/pboard.css");

	/*
		photo: [
			{
				url: photo url,
				overlay: overlay dom,
				onClick
				onShow
			}
		]
	 */
	function init(cont, photo, config) {
		cont = $(cont);
		config = $.extend({
			preview: 3,
			scroll_dir: "top", // top or right
			interval: 3000,
			preview_width: "15rem",
			preview_height: "5rem"
		}, config);

		var main = $(" \
			<div class='com-pboard'> \
				<div class='main-slide'> \
					<div class='slide-front'></div> \
					<div class='slide-back'></div> \
				</div> \
				<div class='preview-set'> \
				</div> \
			</div> \
		");

		var mod = {};

		(function () {
			for (var i = 0; i < photo.length; i++) {
				(function (i) {
					var ph = photo[i];
					var dom = $("<div class='preview' data-id='" + i + "'></div>");
					var loader = $("<div class='ui small loader active'></div>");

					dom.append(loader);
				
					util.bgimg(dom, ph.url, function () {
						loader.remove();
					});

					main.find(".preview-set").append(dom);
				})(i);
			}

			setInterval(function () {
				mod.scrollNext();
			}, config.interval);
		})();

		(function () {
			var cur = 0;
			var locked = false;

			var unit = 100 / config.preview;
			var prop;

			var cur_ph = -1;

			var main_slide = main.find(".main-slide");
			var front = main_slide.find(".slide-front");
			var back = main_slide.find(".slide-back");

			var preview_set = main.find(".preview-set");

			function setMain(ph) {
				if (main_slide.hasClass("switch")) {
					util.bgimg(front, ph.url, function () {
						main_slide.toggleClass("switch");
					});
				} else {
					util.bgimg(back, ph.url, function () {
						main_slide.toggleClass("switch");
					});
				}
			};

			mod.setDir = function (dir) {
				if (dir == "top") {
					prop = "top";

					preview_set.css({
						"width": config.preview_width,
						"height": ""
					});

					main_slide.css({
						"padding-right": config.preview_width,
						"padding-bottom": ""
					});

					main.find(".preview").css({
						"top": "0", "left": "0",
						"height": unit + "%",
						"width": ""
					});

					main.removeClass("left-dir").addClass("top-dir");
				} else {
					prop = "left";

					preview_set.css({
						"width": "",
						"height": config.preview_height,
					});

					main_slide.css({
						"padding-right": "",
						"padding-bottom": config.preview_height,
					});

					main.find(".preview").css({
						"top": "0", "left": "0",
						"height": "",
						"width": unit + "%",
					});

					main.addClass("left-dir").removeClass("top-dir");
				}
			};

			mod.setDir(config.scroll_dir);

			mod.scrollNext = function () {
				if (locked) return;
				locked = true;

				var prev = preview_set.find(".preview");

				cur_ph++;
				if (cur_ph >= photo.length)
					cur_ph -= photo.length;

				prev.css(prop, "-" + unit + "%");

				if (photo[cur_ph].onShow) {
					photo[cur_ph].onShow();
				}

				setMain(photo[cur_ph]);
				
				setTimeout(function () {
					prev.css("transition", "none"); // block the animation
					prev.css(prop, "0");
					preview_set.append($(prev[0]));
					setTimeout(function () {
						prev.css("transition", "");
						locked = false;
					}, 100);
				}, 1200);
			}
		})();

		mod.scrollNext();
		util.media(768, function () {
			mod.setDir("left");
		}, function () {
			mod.setDir("top");
		});

		// setInterval(function () {
		// 	mod.scrollUp();
		// }, 2000);

		cont.append(main);

		var ret = {};

		return ret;
	}

	return { init: init };
});
