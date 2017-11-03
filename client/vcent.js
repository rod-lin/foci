"user strict";

window.vcent = {};

(function ($) {
	vcent.update = function () {
		var i;

		function set(obj) {
			var obj = $(obj);
			var par = obj.parent();
			
			if (obj.hasClass("noext") &&
				obj.height() > par.height()) {
				e.css("top", "");
			} else cent(par, obj);
		}

		var e = $(".vcenter");
		var cent = function (pr, e) { e.css("top", ((pr.innerHeight() - e.outerHeight()) / 2) + "px"); };

		e.css("position", "relative");

		for (i = 0; i < e.length; i++) {
			set(e[i]);
		}

		cent = function (pr, e) { e.css("top", ((pr.innerHeight() - e.outerHeight()) / 2) + "px"); };

		e = $(".avcenter");
		e.css("position", "absolute");

		for (i = 0; i < e.length; i++) {
			set(e[i]);
		}

		return;
	};

	vcent.reset = function (com) {
		if (com.hasClass("vcenter") ||
			com.hasClass("avcenter")) {
			com.removeClass("vcenter");
			com.removeClass("avcenter");
			com.css("top", "");
		}
	};
})(jQuery);
