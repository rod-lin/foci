/* parts */

"use strict";

define([ "com/util", "com/progress", "com/lang" ], function (util, progress, lang) {
	var $ = jQuery;
	foci.loadCSS("com/parts.css");

	var prog;
	var cache = {};

	$("body").ready(function () {
		prog = progress.init("body", { top: true, position: "fixed" });
	});

	function fetch(url, suc, err) {
		$.ajax({
			type: "GET",
			url: url,
			data: { v: (new Date()).getTime() /* no cache */ },
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
			base: "sub"
		}, config);

		var main = $("<div class='com-parts'></div>");

		var onExit = null;

		function load(name, cb, args) {
			var next = function (text) {
				// var loader = $("<div class='ui active loader'></div>");
				prog.inc();

				var show = function (suc) {
					setTimeout(function () {
						main.addClass("show");

						if (suc) {
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

				var part = $(text);
				main.html(part);

				cont.scrollTop(0);

				prog.inc();

				part.ready(function () {
					prog.inc();
					if (window.init) {
						window.init($(part[0]), args, show, cont, ret.jump);
					}
				});
			};

			main.removeClass("show");
			prog.show();

			if (cache.hasOwnProperty(name)) {
				next(cache[name]);
			} else {
				var url = config.base + "/" + name + ".html";
				fetch(url, next, function () {
					if (cb) cb(false);
					prog.err();
				});
			}
		}

		var jump_cb = [];

		var cur_hash = null;

		var hashchange = function () {
			if (cur_hash === window.location.hash)
				return;

			var hash = window.location.hash.slice(1);
			var args;
			var name = "";

			if (hash.length) {
				var split = hash.split("/");
				name = split[0];
				args = split.slice(1);
			} else args = [ "" ];

			var change = function () {
				cur_hash = window.location.hash;

				if (config.onJump) {
					if (config.onJump(name, args) === true)
						return; // no need to jump
				}

				if (!hash.length) return;

				load(name, function (suc) {
					if (!suc)
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

		cont.append(main);

		var ret = {
			load: load,
			refresh: hashchange,
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
