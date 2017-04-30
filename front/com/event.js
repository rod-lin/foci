/* event */
"use strict";

define([ "com/xfilt", "com/waterfall", "com/util", "com/avatar", "com/env" ], function (xfilt, waterfall, util, avatar, env) {
	var $ = jQuery;
	foci.loadCSS("com/event.css");
	foci.loadCSS("com/eqview.css");

	var lim_config = {
		max_title_len: 32,
		max_location_len: 64,
		max_descr_len: 512
	};

	function genDate(start, end) {
		var ret = "";
		var form = function (date) {
			return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
		};

		if (start) ret += form(new Date(start));
		else ret += "TBD";

		ret += " ~ ";

		if (end) ret += form(new Date(end));
		else ret += "TBD";

		return ret;
	}

	function init(cont, config) {
		cont = $(cont);
		config = $.extend({}, lim_config, {
			max_descr_len: 64
		}, config);

		var main = "<div class='com-event'></div>";
		main = $(main);
		
		cont.append(main);

		var wf = waterfall.init(main);

		function genEvent(info) {
			var cover = info.cover ? foci.download(info.cover) : [ "img/tmp1.jpg", "img/tmp2.jpg", "img/tmp3.jpg", "img/tmp4.jpg", "img/tmp5.jpg" ].choose();
			var descr = info.descr ? xfilt(util.short(info.descr, config.max_descr_len)) : "(no description)";
			var title = info.title ? xfilt(util.short(info.title, config.max_title_len)) : "(untitled)";

			var main = $('<div class="ui card event"> \
				<div class="image"> \
					<img src="' + cover + '"> \
				</div> \
				<div class="content"> \
					<a class="header">' + title + '</a> \
					<div class="meta"> \
						<span class="date">' + genDate(info.start, info.end) + '</span> \
					</div> \
					<div class="description"> \
						' + descr + ' \
					</div> \
				</div> \
				<div class="extra content"> \
					<a> \
						<i class="user icon"></i>' + info.partic.length + ' \
					</a> \
				</div> \
			</div>');

			main.find(".image, .header, .description").click(function () { qview(info); });

			return main;
		}

		// TODO: S L O W !?
		function add(info) {
			wf.add(genEvent(info));
		}

		function clear(cb) {
			hide(function () {
				wf.clear();
				show(cb);
			});
		}

		function hide(cb) {
			main.addClass("hide");
			setTimeout(cb, 300);
		}

		function show(cb) {
			// main.css("display", "");
			util.atimes(wf.update, 20);
			setTimeout(function () {
				main.removeClass("hide");
				if (cb) cb();
			}, 200);
		}

		return {
			add: add,
			clear: clear,

			hide: hide,
			show: show
		};
	}

	function qview(info, config) {
		info = info || {};
		config = $.extend({}, lim_config, config);

		var title = info.title ? xfilt(util.short(info.title, config.max_title_len)) : "(untitled)";
		var location = info.title ? xfilt(util.short(info.title, config.max_location_len)) : "(not decided)";
		var time = genDate(info.start, info.end);

		var cover = info.cover ? foci.download(info.cover) : "img/tmp2.jpg";
		var logo = info.logo ? foci.download(info.logo) : "img/deficon.jpg";

		var rating = info.rating ? info.rating : "nop";

		var main = $(" \
			<div class='com-eqview ui large modal'> \
				<div class='cover' style='background-image: url(\"" + cover + "\");'></div> \
				<div class='cover-edit'></div> \
				<div class='logo-cont'> \
					<div class='logo' style='background-image: url(\"" + logo + "\");'></div> \
					<div class='title'>" + title + "</div><div class='rating'>" + rating + "</div><br> \
					<div class='detail'><i class='map outline icon'></i>" + location + "</div> \
					<div class='detail'><i class='calendar outline icon'></i>" + time + "</div> \
				</div> \
				<div class='back not-owner'> \
					<div class='util close'> \
						<i class='close icon'></i> \
					</div><div class='util setting' data-content='Click components to edit'> \
						<i class='setting icon'></i> \
					</div> \
				</div> \
				<div class='cont'> \
					<div class='descr'> \
						<img class='cont-fill' src='img/paragraph.png'></img> \
						<img class='cont-fill' src='img/paragraph.png'></img> \
						<img class='cont-fill' src='img/paragraph.png'></img> \
					</div> \
					<div class='ui horizontal divider'>organizer</div> \
					<div class='orgs'> \
						<img class='cont-fill' src='img/paragraph.png'></img> \
					</div> \
				</div> \
				<!--div class='more'>MORE</div--> \
			</div> \
		");

		var descr = info.descr ? xfilt(util.short(info.descr, config.max_descr_len)) : "(no description)";

		main.find(".descr").html(descr);

		main.find(".back .util.close").click(function () {
			main.modal("hide");
		});

		var setting_open = false;

		function openSetting() {
			var discard = false;

			main.addClass("setting");
			main.find(".back .util .setting")
				.addClass("checkmark");

			main.modal({
				closable: false,
				onHide: function () {
					if (main.hasClass("setting") && !discard) {
						util.ask("Are you sure to discard all the changes?", function (ans) {
							if (ans) {
								discard = true;
								main.modal("hide");
							}
						});

						return false;
					}
				}
			});

			main.modal("refresh");
		
			setTimeout(function () {
				main.find(".back .util.setting")
					.popup({ position: "right center", on: "manual" })
					.popup("show");
			}, 500);
		}

		function closeSetting() {
			main.removeClass("setting");
			main.find(".back .util .setting").removeClass("checkmark");
			main.find(".back .util.setting").popup("hide");
			main.modal({ closable: true });
			main.modal("refresh");
		}

		main.find(".back .util.setting").click(function () {
			if (setting_open) {
				closeSetting();
			} else {
				openSetting();
			}

			setting_open = !setting_open;
		});

		var ava;
		var fill = main.find(".orgs .cont-fill");

		if (env.session()) {
			env.user(function (user) {
				if (info.org && info.org.indexOf(user.uuid) != -1) {
					main.find(".back").removeClass("not-owner");
				}
			});
		}

		if (info.org) {
			var size;

			switch (info.org.length) {
				case 1: size = "3em"; break;
				case 2: size = "2.5em"; break;
				default: size = "2em";
			}

			for (var i = 0; i < info.org.length; i++) {
				foci.get("/user/info", { uuid: info.org[i] }, function (suc, dat) {
					ava = $("<div class='org'></div>");
					if (suc) {
						avatar.init(ava, dat, { size: size });
					} else {
						util.qmsg(dat);
						avatar.init(ava, null, { size: size });
					}

					fill.remove();
					main.find(".orgs").prepend(ava);

					main.ready(function () {
						// main.modal("refresh");
					});
				});
			}
		} else {
			main.find(".orgs").html("<div class='tip'>no organizer</div>");
			fill.remove();
		}

		main.modal();

		// util.listen(function () {
		// 	var before = main.offset().top;
		// 	// main.modal("refresh");
		// 	if (main.offset().top == before) return true;
		// });

		main.ready(function () {
			main.modal("show");
		});
	}

	return {
		init: init,
		qview: qview,
		genDate: genDate
	}
});
