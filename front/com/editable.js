/* editable */

"use strict";

define([ "com/util" ], function (util) {
	foci.loadCSS("com/editable.css");

	function init(obj, onChange, config) {
		obj = $(obj);
		config = $.extend({
			type: "input",
			border: false,
			explicit: false,
			enable: true
		}, config);

		var enable;

		obj
			.addClass("com-editable")
			.click(function () {
				if (!enable && !obj.hasClass("enabled")) return;
				if (config.onEdit && config.onEdit() === false) return;

				var edit;

				if (config.type == "input")
					edit = $("<input class='com-editbox'>");
				else {
					edit = $("<textarea class='com-editbox'></textarea>");
				}

				function pos() {
					var ofs = obj.offset();
					var pofs = obj.parent().offset();

					edit.css({
						top: (ofs.top - pofs.top) + "px",
						left: (ofs.left - pofs.left) + "px",
						height: obj.outerHeight(),
						width: obj.outerWidth(),
						padding: obj.css("padding"),
						"font-size": obj.css("font-size"),
						"font-family": obj.css("font-family"),
						"font-weight": obj.css("font-weight"),
						"line-height": obj.css("line-height"),
						"text-align": obj.css("text-align")
					});
				}

				pos();

				var text = config.text ? config.text() : obj.text();
				edit.val(text);

				$(window).resize(pos);

				obj.after(edit);
				edit.focus();
				edit.blur(function () {
					if (edit.val() != text) {
						onChange(edit.val());
					}

					if (config.onBlur) config.onBlur();

					$(window).off("resize", pos)
					edit.remove();
				})
			});

		if (config.border)
			obj.addClass("always-border");

		var ret = {};

		ret.enable = function (val) {
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
