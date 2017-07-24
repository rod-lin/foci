/* tagbox */

"use strict";

define([ "com/util" ], function (util) {
	var $ = jQuery;
	foci.loadCSS("com/tagbox.css");
	foci.loadCSS("com/imgtag.css");

	function genTag(id, obj) {
		var tag = $("<div class='tag' data-value='" + id + "'>" + obj.name.toUpperCase() + "<i class='deltag cancel icon'></i></div>");
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
		var cur = [];
		var tag_dom = {};

		var menu = main.find(".menu");
		var addtag = main.find(".addtag");

		var tag_count = 0;

		function addTag(name) {
			if (cur.indexOf(name) != -1) return;

			cur.push(name);
			main.find(".addtag").before(tag_dom[name].click(tagOnClick));

			if (cur.length == tag_count) {
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

		for (var k in tags) {
			if (tags.hasOwnProperty(k)) {
				menu.append("<div class='item t-" + k + "'>" + tags[k].name + "</div>");
				tag_dom[k] = genTag(k, tags[k]).click(tagOnClick);
				tag_count++;
			}
		}

		addtag.dropdown({
			onShow: function () {
				for (var k in tags) {
					if (tags.hasOwnProperty(k)) {
						if (cur.indexOf(k) == -1)
							menu.find(".t-" + k).removeClass("active").removeClass("selected").css("display", "");
						else
							menu.find(".t-" + k).removeClass("active").removeClass("selected").css("display", "none");
					}
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

		ret.set = function (init, noev) {
			changed = true;

			delAll();

			cur = init;
			for (var i = 0; i < init.length; i++) {
				main.find(".addtag").before(tag_dom[cur[i]]);
				tag_dom[cur[i]].click(tagOnClick);
			}

			if (cur.length == tag_count) {
				addtag.addClass("disabled");
			}

			if (!noev && config.onChange) config.onChange(cur);
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

		ret.set(config.init, true);

		return ret;
	}

	function imgtag(cont, tags, config) {
		cont = $(cont);
		config = $.extend({}, config);

		var main = $(" \
			<div class='com-tagbox-imgtag'> \
			</div> \
		");

		function genTag(k, tag) {
			var t = $("<div class='imgtag'> \
				<div class='imgtag-img'></div><span class='imgtag-text'></span> \
			</div>");

			t.find(".imgtag-text").html(tag.name);
			if (tag.img) {
				util.bgimg(t.find(".imgtag-img"), tag.img || util.randimg());
			} else if (tag.icon) {
				t.find(".imgtag-img").html("<i class='" + tag.icon + " icon'></i>");;
			}

			t.click(function () {
				util.jump("#search//" + k);
			});

			return t;
		}

		for (var k in tags) {
			if (tags.hasOwnProperty(k))
				main.append(genTag(k, tags[k]));
		}

		cont.append(main);

		var ret = {};

		return ret;
	}

	return {
		init: init,
		imgtag: imgtag
	};
});
