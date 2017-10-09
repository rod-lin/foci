/* tagbox */

"use strict";

define([ "com/util" ], function (util) {
	var $ = jQuery;
	foci.loadCSS("com/tagbox.css");
	foci.loadCSS("com/imgtag.css");

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
		
		function genTag(id, obj, is_trivial) {
			var tag = $("<div class='tag'></div>");
			
			tag.html(obj.name);
			tag.append("<i class='deltag cancel icon'></i>");
			
			if (obj.style)
				tag.addClass(obj.style);
			
			if (!is_trivial) {
				tag.attr("data-value", id);
				
				tag.click(function () {
					if (!main.hasClass("edit"))
						util.jump("#search//" + id);
				});
			} else {
				tag.addClass("trivial");
			}
			
			return tag;
		}
		
		function addTrivial(obj) {
			var dom = genTag(null, obj, true);
			main.find(".tag").first().before(dom);
		}

		function addTag(name) {
			if (cur.indexOf(name) != -1) return;
			if (!tag_dom[name]) return;

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
		
		ret.addTrivial = function (obj) {
			addTrivial(obj);
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
				if (tag_dom[cur[i]]) {
					main.find(".addtag").before(tag_dom[cur[i]]);
					tag_dom[cur[i]].click(tagOnClick);
				}
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

			t.find(".imgtag-text").html("<span>" + tag.name + "</span>");
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

		// justify margins and widths so that tags can fill up the entire container
		function justifyTag() {
			// console.log("justify tag");
			
			main.children("br").remove();

			var arr = main.find(".imgtag").sort(function (a, b) {
				return $(a).width() - $(b).width();
			});

			for (var i = 0; i < arr.length; i++) {
				main.append(arr[i]);
				// main.append(arr[arr.length - i - 1]);
			}

			var narr = main.find(".imgtag");
			var lines = [];
			var cur = [];
			var length = 0;
			var cont_width = cont.width();

			var def_margin = $(narr[0]).outerWidth(true) - $(narr[0]).outerWidth();

			for (var i = 0; i < narr.length; i++) {
				var cur_tag = $(narr[i]);

				var cur_length = cur_tag.outerWidth(true);

				if (length + cur_length > cont_width) {
					cur.total_length = length;
					lines.push(cur);
					cur = [ cur_tag ];
					length = cur_tag.outerWidth(true);
				} else {
					length += cur_length;
					cur.push(cur_tag);
				}
			}

			cur.total_length = length;
			lines.push(cur);

			for (var i = 0; i < lines.length - 1; i++) {
				var line = lines[i];
				if (line.length > 1) {
					var gap = (cont_width - line.total_length + def_margin) / line.length;
					// console.log(gap);
					for (var j = 0; j < line.length; j++) {
						// line[j].css("margin-right", gap + "px");
						var tag_width = $(line[j]).find(".imgtag-text span").width();
						$(line[j]).find(".imgtag-text").width(tag_width + gap + "px");
					}

					line[line.length - 1].css("margin-right", "0").after("<br>");
				}
			}
		}

		cont.ready(function () {
			justifyTag();
			// justifyTag();
			
			var justify_lock = false;
			
			$(window).resize(function () {
				if (justify_lock) return;
				justify_lock = true;
				
				main.find(".imgtag-text").css("width", "");
				main.find(".imgtag").css("margin-right", "");
				
				setTimeout(function () {
					justifyTag();
					justify_lock = false;
				}, 100);
			});
		});

		// setTimeout(justifyTag, 5000);

		cont.append(main);

		var ret = {};

		return ret;
	}

	return {
		init: init,
		imgtag: imgtag
	};
});
