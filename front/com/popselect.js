/* popup select */

"use strict";

define([ "com/util" ], function (util) {
	foci.loadCSS("com/popselect.css");

	/*
		option: [
			{
				cont: "<html>",
				onSelect: function
			}
		]
	 */
	function init(obj, option, config) {
		obj = $(obj);
		config = $.extend({
			position: "bottom center"
		}, config);

		var main = $(" \
			<div class='com-popselect ui popup hidden'> \
			</div> \
		");

		$("body").append(main);

		var selected = false;

		function genOption(opt) {
			var item = $("<div class='option'></div>");

			item.html(opt.cont);
			item.click(function () {
				if (opt.onSelect) {
					if (opt.onSelect() !== false) {
						obj.popup("hide");
					}
				}
			});

			return item;
		}

		option = option || [];
		for (var i = 0; i < option.length; i++) {
			main.append(genOption(option[i]));
		}

		obj.popup({
			popup: main,
			lastResort: true,
			on: "click",

			position: config.position,
			
			onShow: function () {
				selected = false;
			},

			onHide: function () {
				if (!selected && config.onNothing) {
					config.onNothing();
				}
			}
		});

		var ret = {};

		return ret;
	}

	return { init: init };
});
