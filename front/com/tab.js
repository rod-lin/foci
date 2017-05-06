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
					var onright = false;
					var style = "";

					var onShow = null;
					var onChange = null;

					if (typeof tabs[k] === "object") {
						dname = tabs[k].name;
						
						onShow = tabs[k].onShow;
						onChange = tabs[k].onChange;

						onright = tabs[k].float === "right";
						
						if (tabs[k].style) style = tabs[k].style;
					} else {
						dname = tabs[k];
					}

					var item = $("<div class='item" + (onright ? " right" : "") + " " + style + "'>" + dname + "</div>");
					var tab = $("<div class='tab'></div>");
					
					items[k] = { 
						item: item,
						tab: tab,
						onChange: onChange
					};

					menu.append(item);
					main.children(".tabs").append(tab);

					item.click(function () {
						if (cur == name) return;

						if (cur && items[cur].onChange) {
							if (items[cur].onChange() === false) {
								return;
							}
						}

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
			return items[name].tab;
		};

		ret.getItem = function (name) {
			return items[name].item;
		};

		ret.to = function (name) {
			items[name].item.click();
		};

		ret.flow = function (open) {
			if (open) {
				var items = menu.children(".item");
				items.css("width", (1 / items.length * 100) + "%");
				menu.addClass("flow");
			} else {
				menu.children(".item").css("width", "");
				menu.removeClass("flow");
			}
		};

		ret.displayHeight = function () {
			return cont.parent().innerHeight() - menu.outerHeight();
		};

		return ret;
	}

	return {
		init: init
	};
});
