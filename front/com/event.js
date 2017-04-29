/* event */
"use strict";

define([ "com/xfilt", "com/waterfall", "com/util", "com/avatar" ], function (xfilt, waterfall, util, avatar) {
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

			var main = '<div class="ui card event"> \
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
			</div>';

			main = $(main);

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
			wf.update();
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
				<div class='logo-cont'> \
					<div class='logo' style='background-image: url(\"" + logo + "\");'></div> \
					<div class='title'>" + title + "</div><div class='rating'>" + rating + "</div> \
					<div class='detail'><i class='map outline icon'></i>" + location + "</div> \
					<div class='detail'><i class='calendar outline icon'></i>" + time + "</div> \
				</div> \
				<div class='back'><i class='close icon'></i></div> \
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

		main.find(".back").click(function () {
			main.modal("hide");
		});

		var ava;
		var fill = main.find(".orgs .cont-fill");

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
				});
			}
		} else {
			main.find(".orgs").html("<div class='tip'>no organizer</div>");
			fill.remove();
		}

		main.ready(function () {
			main.modal("show");

			main.ready(function () {
				vcent.update();
				main.modal("refresh");
			});
		});
	}

	return {
		init: init,
		qview: qview,
		genDate: genDate
	}
});
