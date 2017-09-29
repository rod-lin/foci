/* popup select */

"use strict";

define([ "com/util" ], function (util) {
	foci.loadCSS("com/popselect.css");

	function text(obj, config) {
		obj = $(obj);
		config = $.extend({
			position: "bottom center",
			prompt: "Text",
			
			// onSubmit
		}, config);
		
		var main = $("<div class='com-popselect-text'> \
			<div class='ui form'> \
				<div class='ui field'> \
					<textarea type='text' style='width: 15rem; height: 8rem;'></textarea> \
				</div> \
				<div style='position: relative;'> \
					<div class='ui inline loader tiny'></div> \
					<i class='submit-btn check icon'></i> \
				</div> \
			\</div> \
		</div>");
		
		main.find("textarea").attr("placeholder", config.prompt);
		
		main.find(".submit-btn").click(function () {
			if (config.onSubmit) {
				main.find(".loader").addClass("active");
				config.onSubmit(function () {
					main.find(".loader").removeClass("active");
				});
			}
		});
		
		obj.popup({
			html: main,
			lastResort: true,
			on: "click",

			position: config.position,
			
			onHide: function () {
				if (config.onHide)
					return config.onHide();
			}
		});
		
		var mod = {};
		
		mod.hide = function () {
			obj.popup("hide");
		};
		
		mod.val = function () {
			return main.find("textarea").val();
		};
		
		return mod;
	}

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
			item.click(function (ev) {
				if (opt.onSelect) {
					if (opt.onSelect() !== false) {
						obj.popup("hide");
						ev.stopPropagation();
						// TODO: temp fix
						// BUG: if the popselect is selected in a modal for the FIRST time,
						// closing the popup will close the modal as well.
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

	return { init: init, text: text };
});
