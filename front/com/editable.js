/* editable */

"use strict";

define([ "com/util", "com/xfilt" ], function (util, xfilt) {
	foci.loadCSS("com/editable.css");

	function init(obj, onChange, config) {
		obj = $(obj);
		config = $.extend({
			type: "input",
			explicit: false,
			enable: true,
			
			// onEnable
		}, config);

		var enable;

		onChange = onChange || function (val, dom) {
			dom.html(xfilt(val));
		};

		// obj.parent().css("position", "relative");

		obj
			.addClass("com-editable")
			.click(function () {
				var clicked = $(this);

				if (!enable && !clicked.hasClass("enabled")) return;
				if (config.onEdit && config.onEdit() === false) return;

				var edit;

				if (config.type == "input")
					edit = $("<input class='com-editbox'>");
				else {
					edit = $("<textarea class='com-editbox'></textarea>");
				}

				function pos() {
					var ofs = clicked.offset();
					var pofs = clicked.parent().offset();

					edit.css({
						top: (ofs.top - pofs.top) + "px",
						left: (ofs.left - pofs.left) + "px",
						height: clicked.outerHeight(),
						width: clicked.outerWidth(),
						padding: clicked.css("padding"),
						"font-size": clicked.css("font-size"),
						"font-family": clicked.css("font-family"),
						"font-weight": clicked.css("font-weight"),
						"line-height": clicked.css("line-height"),
						"text-align": clicked.css("text-align")
					});
				}

				pos();

				var text = config.text ? config.text() : clicked.text();
				edit.val(text);

				$(window).resize(pos);

				clicked.after(edit);
				edit.focus();
				edit.blur(function () {
					if (edit.val() != text) {
						onChange(edit.val(), clicked);
					}

					if (config.onBlur) config.onBlur();

					$(window).off("resize", pos)
					edit.remove();
				})
			});

		var ret = {};

		ret.enable = function (val) {
			if (val === undefined) return enable;
			
			if (enable = val)
				obj.addClass("enabled");
			else
				obj.removeClass("enabled");
		};

		ret.explicit = function (val) {
			if (val) {
				obj.addClass("explicit");
			} else {
				obj.removeClass("explicit");
			}
		};

		ret.enable(config.enable);
		ret.explicit(config.explicit);

		return ret;
	}

	return { init: init };
});
