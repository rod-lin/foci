/* tagbox */

"use strict";

define([], function () {
	var $ = jQuery;
	foci.loadCSS("com/tagbox.css");

	function genTag(name) {
		var tag = $("<div class='tag' data-value='" + name + "'>" + name.toUpperCase() + "<i class='deltag cancel icon'></i></div>");
		return tag;
	}

	function init(cont, tags /* all tags allowed */, config) {
		cont = $(cont);
		config = $.extend({
			init: []
			// onChange
		}, config);

		var main = $(" \
			<div class='com-tagbox'> \
				<div class='addtag tag ui floating dropdown'> \
					<i class='add icon'></i> \
					<div class='menu'> \
					</div> \
				</div> \
			</div> \
		");

		cont.append(main);

		var ret = {};
		var cur = config.init;
		var tag_dom = {};

		var menu = main.find(".menu");
		var addtag = main.find(".addtag");

		function addTag(name) {
			if (cur.indexOf(name) != -1) return;
			cur.push(name);
			main.find(".addtag").before(tag_dom[name].click(tagOnClick));

			if (cur.length == tags.length) {
				addtag.addClass("disabled");
			}

			if (config.onChange) config.onChange(cur);
		}

		function delTag(name) {
			var i;
			if ((i = cur.indexOf(name)) == -1) return;
			cur.splice(i, 1);
			tag_dom[name].remove();

			addtag.removeClass("disabled");

			if (config.onChange) config.onChange(cur);
		}

		function delAll() {
			addtag.removeClass("disabled");
			
			for (var i = 0; i < cur.length; i++) {
				tag_dom[cur[i]].remove();
			}

			cur = [];
		}

		function tagOnClick() {
			if (main.hasClass("edit"))
				delTag($(this).attr("data-value"));
		}

		for (var i = 0; i < tags.length; i++) {
			menu.append("<div class='item t-" + tags[i] + "'>" + tags[i] + "</div>");
			tag_dom[tags[i]] = genTag(tags[i]).click(tagOnClick);
		}

		for (var i = 0; i < cur.length; i++) {
			main.find(".addtag").before(tag_dom[cur[i]]);
		}

		addtag.dropdown({
			onShow: function () {
				for (var i = 0; i < tags.length; i++) {
					if (cur.indexOf(tags[i]) == -1)
						menu.find(".t-" + tags[i]).removeClass("active").removeClass("selected").css("display", "");
					else
						menu.find(".t-" + tags[i]).removeClass("active").removeClass("selected").css("display", "none");
				}
			},

			onChange: function (value) {
				addTag(value);
			}
		});

		var changed;

		ret.add = function (name) {
			changed = true;
			addTag(name);
		};

		ret.clear = function () {
			changed = true;
			delAll();
		};

		ret.set = function (init) {
			changed = true;

			delAll();

			cur = init;
			for (var i = 0; i < init.length; i++) {
				main.find(".addtag").before(tag_dom[cur[i]]);
			}
			
			if (config.onChange) config.onChange(cur);
		};

		ret.openEdit = function () {
			changed = false;
			main.addClass("edit");
		};

		ret.closeEdit = function () {
			main.removeClass("edit");
		};

		ret.hasChanged = function () {
			return changed;
		};

		ret.cur = function () {
			return cur;
		};

		return ret;
	}

	return {
		init: init
	};
});
