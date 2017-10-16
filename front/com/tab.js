/* tab */

"use strict";

define([ "com/util" ], function (util) {
	var $ = jQuery;
	foci.loadCSS("com/tab.css");
	
	function common(items, tabs, config) {
		items = $(items);
		tabs = $(tabs);
		
		config = $.extend({
			active: "active",
			init: 0
		}, config);
		
		var cur = config.init;
		
		function activateItem(i) {
			items.filter("." + config.active).removeClass(config.active);
			$(items[i]).addClass(config.active);
		}
		
		function switchTo(i) {
			activateItem(i);
			
			$(tabs[cur]).css("display", "none");
			$(tabs[i]).css("display", "");
			
			if (cur != i) {
				$(tabs[cur]).triggerHandler("tab:hide");
				cur = i;
				$(tabs[i]).triggerHandler("tab:show");
			}
		}
		
		tabs.each(function (i, dom) {
			$(dom).css("display", "none");
			$(dom).swipe({
				swipe: function (e, dir) {
					if (util.isMobile()) {
						if (dir == "left") {
							if (i < tabs.length - 1) {
								switchTo(i + 1);
							}
						} else if (dir == "right") {
							if (i > 0) {
								switchTo(i - 1);
							}
						}
					}
				},
				
				preventDefaultEvents: false
			});
		});

		function bind(items) {
			items.each(function (i, dom) {
				$(dom).click(function () {
					switchTo(i);
				});
			});
		}
		
		bind(items);
		
		switchTo(config.init);
		$(tabs[config.init]).triggerHandler("tab:show");
		
		var mod = {};
		
		mod.switchTo = switchTo;
		mod.bind = bind;
		
		mod.setMenu = function (new_items) {
			items = new_items;
			activateItem(cur); // to synhronize possible multiple menus
		};
		
		return mod;
	}

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

		var keys = Object.keys(tabs).sort(function (a, b) {
			return (tabs[a].order || 0) - (tabs[b].order || 0);
		});

		for (var i = 0; i < keys.length; i++) {
			var k = keys[i];

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

					var item = $("<button class='item" + (onright ? " right" : "") + " " + style + "'>" + dname + "</button>");
					var tab = $("<div class='tab'></div>");

					items[k] = {
						item: item,
						tab: tab,
						onChange: onChange
					};

					menu.append(item);
					main.children(".tabs").append(tab);

					item.click(function () {
						var next = function () {
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
						};

						if (cur == name) return;

						if (cur && items[cur].onChange) {
							if (items[cur].onChange(function (cast) {
								if (cast !== false)
									next();
							}) === false) {
								return;
							}
						}

						next();
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
		
		ret.refresh = function () {
			var tmp = cur;
			cur = null;
			items[tmp].item.click();
		};

		ret.cur = function () {
			return cur;
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

		ret.has = function (name) {
			return items.hasOwnProperty(name);
		};

		ret.displayHeight = function () {
			return cont.parent().height() - menu.outerHeight(true);
		};

		return ret;
	}

	return {
		init: init,
		common: common
	};
});
