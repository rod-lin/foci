/* parts */

"use strict";

define([ "com/util", "com/progress", "com/lang" ], function (util, progress, lang) {
	var $ = jQuery;
	foci.loadCSS("com/parts.css");

	var global_prog;
	var cache = {};

	global_prog = progress.init("body", { top: true, position: "fixed" });

	function fetch(url, suc, err, prog) {
		$.ajax({
			type: "GET",
			url: url,
			data: { v: foci.version /* no cache */ },
			success: function (dat) { suc(dat); },
			error: function (req, exc) {
				util.emsg("$front.com.parts.fail_get_url(" + url + "," + exc + ")");
				err();
			}
		});
	}

	function init(cont, config) {
		cont = $(cont);
		config = $.extend({
			penv: {},
			base: "/mcom/mpart?part=",
			global_progress: true,
			
			forced_refresh: []
		}, config);

		var main = $("<div class='com-parts'><div class='part-cont'></div></div>");
		var main_cont = main.children(".part-cont");

		var onExit = null;
		
		var prog;
		
		if (config.global_progress) {
			prog = global_prog;
		} else {
			prog = progress.init(main, { top: true, position: "absolute" });
		}

		function load(name, cb, args) {
			var next = function (text) {
				// var loader = $("<div class='ui active loader'></div>");
				prog.sinc();

				var show = function (suc) {
					setTimeout(function () {
						if (suc) {
							main.addClass("show");
							prog.complete();
							setTimeout(prog.hide, 1000);

							lang.update(main);
						} else {
							prog.err();
							setTimeout(prog.hide, 2000);
						}

						// loader.remove();
						if (cb) cb(!!suc);
					}, 300);
				};

				var part = cur_part_dom = $(text);
				main_cont.html(part);

				cont.scrollTop(0);

				prog.sinc();

				part.ready(function () {
					prog.sinc();
					if (window.init) {
						window.init($(part[0]), args, show, cont, ret.jump, config.penv);
					}
				});
			};

			main.removeClass("show");
			prog.show();

			if (cache.hasOwnProperty(name)) {
				next(cache[name]);
			} else {
				var proc = setInterval(function () {
					prog.fakeinc(70);
				}, 70);

				var url = config.base + name;
				fetch(url, function (text) {
					// clearInterval(proc);
					next(text);
				}, function () {
					// clearInterval(proc);
					if (cb) cb(false, true /* not found */);
					prog.err();
				});
			}
		}

		var jump_cb = [];

		var cur_hash = null;
		var cur_part = null;
		var cur_part_dom = null;

		var hashchange = function (forced) {
			if (forced !== true && cur_hash === window.location.hash)
				return;
				
			var hash = window.location.hash.slice(1);
			var args;
			var name = "";

			if (hash.length) {
				var split = hash.split("/");
				name = split[0];
				args = split.slice(1);
			} else args = [ "" ];
			
			// alert([ forced, config.forced_refresh.indexOf(cur_part), cur_part, name ]);
			
			if (forced !== true && config.forced_refresh.indexOf(cur_part) == -1 &&
				name == cur_part) {
				if (cur_part_dom) {
					cur_part_dom.trigger("part:argchange", [ args ]);
				}
				
				return;
			}
			
			cur_part = name;

			var change = function () {
				cur_hash = window.location.hash;

				if (config.onJump) {
					if (config.onJump(name, args) === true)
						return; // no need to jump
				}

				if (!hash.length) return;

				load(name, function (suc, notfound) {
					if (notfound)
						util.jump("#e404");
				}, args);
				
				jump_cb = [];
			};

			var restore = function () {
				window.location.hash = cur_hash;
			};

			for (var i = 0; i < jump_cb.length; i++) {
				if (jump_cb[i](function (suc) {
						if (suc) change();
						else restore();
					}) === false) {
					return;
				}
			}

			change();
		};

		if (window.location.hash !== undefined) {
			util.nextTick(hashchange);
			$(window).on("hashchange", hashchange);
		}
		
		// $(window).on("popstate", hashchange);

		cont.append(main);

		var ret = {
			load: load,
			refresh: function () {
				hashchange(true);
			},
			
			forceJump: function (url) {
				if (window.location == url) {
					ret.refresh();
				} else {
					window.location = url;
				}
			},
			
			jump: function (cb) { // all jump events will be cleared after a successful jump
				if (jump_cb.indexOf(cb) == -1)
					jump_cb.push(cb);
			}
		};

		return ret;
	}

	return {
		init: init
	};
});
