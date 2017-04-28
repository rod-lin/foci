"use strict";

define(function () {
	function init(cont) {
		cont = $(cont);

		var main = $("<iframe></iframe>");

		cont.append(main);

		var prop = {
			position: "absolute",
			height: "100%",
			width: "100%",
			left: "0",

			border: "0",

			transition: "top 0.3s, opacity 0.3s"
		};

		main.css(prop);

		return {
			open: function (url) {
				main.css("opacity", "0");
				setTimeout(function () {
					main.attr("src", url);
					main.on("load", function () {
						main.off("load");
						// alert("loaded");
						// main.unbind("load");
						main.css("opacity", "1");
					});
				}, 300);

				return;
			}
		}
	}

	return {
		init: init
	};
});
