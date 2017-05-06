/* tab */

"use strict";

define(function () {
	var $ = jQuery;
	foci.loadCSS("com/tab.css");

	function init(cont, tabs, config) {
		cont = $(cont);
		config = $.extend({
		}, config);

		var main = $(' \
			<div class="com-tab"> \
				<div class="ui loader"></div> \
				<div class="menu"></div> \
				<div class="tabs"></div> \
			</div> \
		');

		var menu = main.children(".menu");
		var loader = main.children(".loader");

		var items = {};
		var cur = null;

		for (var k in tabs) {
			if (tabs.hasOwnProperty(k)) {
				(function (name) {
					var dname;
					var onShow = null;

					if (typeof tabs[k] === "object") {
						dname = tabs[k].name;
						onShow = tabs[k].onShow;
					} else {
						dname = tabs[k];
					}

					var item = $("<div class='item'>" + dname + "</div>");
					var tab = $("<div class='tab'></div>");
					
					items[k] = [ item, tab ];
					menu.append(item);
					main.children(".tabs").append(tab);

					item.click(function () {
						if (cur == name) return;
						cur = name;

						menu.children(".item.active").removeClass("active");
						main.children(".tabs").children(".active").removeClass("active");

						item.addClass("active");
					
						if (onShow) {
							tab.addClass("active");
							loader.addClass("active");
							tab.css("opacity", "0");
							
							onShow(function () {
								loader.removeClass("active");
								tab.css("opacity", "1");
							});
						} else {
							tab.addClass("active");
						}
					});
				})(k);
			}
		}

		cont.append(main);

		var ret = {};

		ret.getTab = function (name) {
			return items[name][1];
		};

		ret.to = function (name) {
			items[name][0].click();
		};

		ret.flow = function (open) {
			if (open) {
				var items = menu.children(".item");
				items.css("width", (1 / items.length * 100) + "%");
			} else {
				menu.children(".item").css("width", "");
			}
		};

		return ret;
	}

	return {
		init: init
	};
});
