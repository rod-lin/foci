/* tagbox */

"use strict";

define([ "com/util", "com/xfilt" ], function (util, xfilt) {
	var $ = jQuery;
	foci.loadCSS("com/tagbox.css");
	foci.loadCSS("com/imgtag.css");
	
	var hex_color_reg = /^\s*#([0-9a-zA-Z]{3}|[0-9a-zA-Z]{6})\s*$/;
	
	function getForeground(color) {
		var match = hex_color_reg.exec(color);
		if (!match) return "#000";
		
		var hex = match[1];
		var rgb = [ 0, 0, 0 ];
		

		if (hex.length == 3) {
			rgb[0] = parseInt("0x" + hex[0], 16);
			rgb[1] = parseInt("0x" + hex[1], 16);
			rgb[2] = parseInt("0x" + hex[2], 16);
		} else {
			// 6 bits
			// alert([ hex.substring(0, 2), parseInt("0x" + hex.substring(0, 2), 16) ]);
			
			rgb[0] = parseInt("0x" + hex.substring(0, 2), 16);
			rgb[1] = parseInt("0x" + hex.substring(2, 4), 16);
			rgb[2] = parseInt("0x" + hex.substring(4, 6), 16);
		}
		
		var ave = (rgb[0] + rgb[1] + rgb[2]) / 3;
		
		if (ave < 180) { // black background
			return "#EBEBEB";
		} else {
			return "#141414";
		}
	}
	
	function genColorTag(tag, config) {
		config = $.extend({
			margin: "0 0.4em 0.4em 0"
		}, config);
		
		var sp = tag.split(":");
		var bg = sp[0];
		var fg = sp[1];
		var name = sp.slice(2).join(":");
		
		var tdom = $("<div class='com-tagbox-colortag'></div>");
		
		tdom.css({
			margin: config.margin
		});
		
		var delbtn = $("<i class='fitted cancel delbtn icon' style='margin-left: 0.5rem;'></i>");
		
		if (config.onDelete)
			delbtn.click(function () {
				config.onDelete(tag, tdom);
			});
		
		tdom.html(xfilt(name))
			.append(delbtn)
			.css({
				color: fg,
				background: bg
			});
		
		return tdom;
	}
	
	function palette(cont, config) {
		cont = $(cont);
		config = $.extend({
			cont_width: null,
			col: 6,
			margin: 6,
			colors: [],
			
			// onChoose
		}, config);
		
		var main = $("<div class='com-palette'> \
		</div>");
		
		function genColor(color, width, margin) {
			var cdom = $("<div class='color'></div>");
			
			cdom.css({
				background: color,
				width: width + "px",
				height: width + "px",
				"margin-right": margin + "px"
			});
			
			cdom.click(function () {
				if (config.onChoose)
					config.onChoose(color);
			});
			
			return cdom;
		}
		
		function genColorSet(colors, cont_width, col, margin) {
			// alert([ cont_width, col, margin ]);
			var width = (cont_width - (col - 1) * margin) / col;
			var row = Math.ceil(colors.length / col);
			
			for (var i = 0; i < row; i++) {
				var rdom = $("<div class='row'></div>");
				
				if (i + 1 != row)
					rdom.css({
						"height": width + "px",
						"margin-bottom": margin + "px"
					});
					
				main.append(rdom);
				
				for (var j = 0; j < col; j++) {
					if (i * col + j < colors.length) {
						rdom.append(genColor(colors[i * col + j], width, margin));
					} else break;
				}
			}
		}
		
		if (!config.cont_width) {
			cont.ready(function () {
				genColorSet(config.colors, cont.width(), config.col, config.margin);
			});
		} else {
			genColorSet(config.colors, config.cont_width, config.col, config.margin);
		}
		
		cont.append(main);
		
		var mod = {};
		
		return mod;
	}
	
	// newtag panel(color)
	function newtag(cont, config) {
		cont = $(cont);
		config = $.extend({
			width: 200,
			available: [],
			
			// onUse
		}, config);
	
		var main = $("<div class='com-tagbox-newtag'> \
			<div class='ui fluid input' style='margin-bottom: 0.5rem;'> \
				<input class='tag-name' placeholder='Tag name'> \
			</div> \
			<div class='ui fluid right action input' style='margin-bottom: 0.5rem;'> \
				<input class='color-value' placeholder='Color'> \
				<button class='ui icon button change-color-btn'> \
					<i class='refresh icon'></i> \
				</button> \
			</div> \
			<div class='palette'></div> \
			<div class='ui basic button use-btn' style='margin-top: 0.5rem; width: 100%;'> \
				<i class='fitted check icon' style='margin-right: 0 !important;'></i> \
			</div> \
		</div>");
		
		function setCurColor(color) {
			var input = main.find(".color-value");
			
			if (!hex_color_reg.test(color)) {
				// util.emsg("illegal color");
				input.css("background", "#fff")
					 .css("color", "#000");
				return;
			}
			
			input.val(color)
				 .css("background", color)
				 .css("color", getForeground(color));
		}
		
		function randomColor() {
			var rgb = [
				util.fill0(Math.floor(Math.random() * 256).toString(16), 2),
				util.fill0(Math.floor(Math.random() * 256).toString(16), 2),
				util.fill0(Math.floor(Math.random() * 256).toString(16), 2)
			];
			
			var val = "#" + rgb.join("");
			
			setCurColor(val);
		}
		
		main.css("width", config.width + "px");
		
		palette(main.find(".palette"), {
			cont_width: config.width,
			colors: [
				"#1ABC9C", "#2ECC71", "#3498DB", "#9B59B6", "#34495E",
				"#F1C40F", "#E67E22", "#E74C3C", "#BDC3C7", "#7F8C8D"
			],
			
			onChoose: function (color) {
				setCurColor(color);
			}
		});
		
		(function () {
			var proc = null;
			
			main.find(".color-value").keydown(function () {
				if (proc) clearTimeout(proc);
				var proc = setTimeout(function () {
					setCurColor(main.find(".color-value").val());
				}, 100);
			});
			
			main.find(".change-color-btn").click(randomColor);
			
			randomColor();
			
			main.find(".use-btn").click(function () {
				var color = main.find(".color-value").val();
				var name = main.find(".tag-name").val();
				
				if (!hex_color_reg.test(color)) {
					util.emsg("illegal color value");
					return;
				}
				
				if (!name) {
					util.emsg("empty name");
					return;
				}
				
				if (config.onUse) {
					main.find(".use-btn").addClass("loading");
					
					config.onUse({
						name: name,
						color: color
					}, function () {
						main.find(".use-btn").removeClass("loading");
					});
				}
			});
		})();
	
		cont.append(main);
	
		var mod = {};
	
		return mod;
	}
	
	function colortag(cont, config) {
		cont = $(cont);
		config = $.extend({
			init: [], // tag format: <bg>:<fg>:<name>
			available: [],
			
			// onUpdate
		}, config);
		
		var main = $("<div class='com-tagbox-colortag-set'> \
			<div class='com-tagbox-colortag addbtn'><i class='fitted add icon'></i></div \
			><div class='com-tagbox-colortag updatebtn'><div class='ui inline tiny active loader'></div><i class='fitted check icon'></i></div> \
		</div>");
		
		function deleteTag(name, dom) {
			var found = null;
			
			for (var i = 0; i < cur_tags.length; i++) {
				if (cur_tags[i].dom === dom) {
					found = i;
				}
			}
			
			if (found != null) {
				cur_tags.splice(found, 1);
				dom.remove();
			}
			
			main.addClass("edited");
		}
		
		var cur_tags = [];
		
		for (var i = 0; i < config.init.length; i++) {
			if (!config.init[i]) continue;
			
			var dom = genColorTag(config.init[i], {
				onDelete: deleteTag
			});
			
			cur_tags.push({
				name: config.init[i],
				dom: dom
			});
			
			main.find(".addbtn").before(dom);
		}
		
		var addpopup = $("<div class='ui popup'></div>");

		cont.append(main);
		cont.append(addpopup);
		
		newtag(addpopup, {
			onUse: function (dat, cb) {
				// cb();
				var val = dat.color + ":" + getForeground(dat.color) + ":" + dat.name;
				var dom = genColorTag(val, { onDelete: deleteTag });
				
				cur_tags.push({
					name: val,
					dom: dom
				});
				
				main.find(".addbtn").before(dom);
				
				cb();
				main.find(".addbtn").popup("hide");
				
				main.addClass("edited");
			}
		});
		
		main.find(".addbtn").popup({
			popup: addpopup,
			on: "click",
			position: "top center"
		});
		
		main.find(".updatebtn").click(function () {
			var result = [];
			
			for (var i = 0; i < cur_tags.length; i++) {
				result.push(cur_tags[i].name);
			}
			
			main.find(".updatebtn").addClass("loading");
			
			if (config.onUpdate) {
				config.onUpdate(result, function () {
					main.find(".updatebtn").removeClass("loading");
					main.removeClass("edited");
				});
			}
		});
		
		var mod = {};
		
		mod.setEditable = function (edit) {
			if (edit) {
				main.addClass("editable");
			} else {
				main.removeClass("editable edited");
			}
		};
		
		return mod;
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

			cur = [];

			for (var i = 0; i < init.length; i++) {
				var dom = tag_dom[init[i]];

				if (dom) {
					cur.push(init[i]);
					main.find(".addtag").before(dom);
					dom.click(tagOnClick);
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
		config = $.extend({
			shuffle: true
		}, config);

		var main = $(" \
			<div class='com-tagbox-imgtag'> \
				<div class='imgtag-cont'></div> \
			</div> \
		");

		function genTag(k, tag) {
			var t = $("<div class='imgtag'> \
				<div class='imgtag-img'><div class='imgtag-text'></div></div> \
			</div>");

			if (tag.show_more) {
				t.addClass("show-more-btn");
				t.find(".imgtag-text").html(tag.cont);
			} else {
				t.find(".imgtag-text").html(tag.name);

				// if (tag.icon) {
				// 	t.find(".imgtag-text").prepend("<i class='icon " + tag.icon + "'></i>");
				// }

				t.attr("title", tag.name);

				if (tag.img) {
					util.bgimg(t.find(".imgtag-img"), tag.img || util.randimg());
				}

				t.click(function () {
					util.jump("#search//" + k);
				});
			}

			return t;
		}

		var pairs = [];

		for (var k in tags) {
			if (tags.hasOwnProperty(k))
				pairs.push([ k, tags[k] ]);
		}

		pairs = util.shuffle(pairs);

		for (var i = 0; i < pairs.length; i++) {
			main.find(".imgtag-cont").append(genTag(pairs[i][0], pairs[i][1]));
		}

		// main.find(".imgtag-cont").append(genTag("", {
		// 	show_more: true,
		// 	cont: "More"
		// }));

		function updateLayout(col, row) {

			main.find(".imgtag").css("display", "");
			main.find(".imgtag").not(".show-more-btn").each(function (i, dom) {
				if (i >= col * row) {
					$(dom).css("display", "none");
				}
			});

			main.removeClass("col-2 col-3 col-4 col-5").addClass("col-" + col);

			main.find(".imgtag-cont").css("width", "");
			main.css("height", "");

			setTimeout(function () {
				var w = main.find(".imgtag-cont").width();
				var h = main.height();

				main.find(".imgtag-cont").width(w + 2);
				main.height(h - 2);
			}, 100);
		}

		$(window).resize(function () {
			var width = util.windowWidth();

			// alert(width);

			if (width >= 960) {
				updateLayout(4, 2);
			} else if (width >= 720 && width < 960) {
				updateLayout(3, 2);
			} else if (width < 720) {
				updateLayout(2, 3);
			}
		}).resize();

		// setTimeout(justifyTag, 5000);

		cont.append(main);

		var ret = {};

		return ret;
	}

	return {
		init: init,
		imgtag: imgtag,
		colortag: colortag,
		genColorTag: genColorTag
	};
});
