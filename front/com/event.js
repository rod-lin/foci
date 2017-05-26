/* event */
"use strict";

define([
	"com/xfilt", "com/waterfall", "com/util",
	"com/avatar", "com/env", "com/upload",
	"com/login", "com/map", "com/tagbox",
	"com/rating"
], function (xfilt, waterfall, util, avatar, env, upload, login, map, tagbox, rating) {
	var $ = jQuery;
	foci.loadCSS("com/event.css");
	foci.loadCSS("com/eqview.css");

	var lim_config = {
		max_title_len: 32,
		max_descr_len: 512,
		max_detail_len: 1024
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

	function eventTemplate() {
		var main = $('<div class="com-event-single ui card event"> \
			<div class="ui loader"></div> \
			<div class="cover-cont"><img class="cover"></img></div> \
			<div class="content"> \
				<a class="header title"></a> \
				<div class="meta"> \
					<span class="date"></span> \
				</div> \
				<div class="description"></div> \
			</div> \
			<div class="extra content favtag"> \
			</div> \
			<div class="extra content"> \
				<a> \
					<i class="user icon"></i><span class="apply_num"></span> \
				</a> \
				<i class="right floated star icon" style="margin: 0;" data-content="focus"></i> \
			</div> \
		</div>');

		main.find(".star.icon").popup({
			position: "left center"
		});

		return main;
	}

	function parseInfo(info, config) {
		config = $.extend({}, lim_config, config);

		var ret = {};

		ret.cover = info.cover ? foci.download(info.cover) : [ "img/tmp1.jpg", "img/tmp2.jpg", "img/tmp3.jpg", "img/tmp4.jpg", "img/tmp5.jpg" ].choose();
		ret.logo = info.logo ? foci.download(info.logo) : "img/deficon.jpg";
		
		ret.descr = info.descr ? xfilt(util.short(info.descr, config.max_descr_len)) : "(no description)";
		ret.title = info.title ? xfilt(util.short(info.title, config.max_title_len)) : "(untitled)";
		
		ret.detail = info.detail ? xfilt(util.short(info.title, config.max_detail_len)) : "(no detail)";

		ret.date = genDate(info.start, info.end);
		
		ret.apply_num = info.apply_num;
		ret.rating = info.rating ? info.rating : "nop";

		ret.favtag = info.favtag ? info.favtag : [];

		ret.org = info.org || [];

		ret.location = function (cb) {
			if (info.loclng && info.loclat) {
				ret.loclng = info.loclng;
				ret.loclat = info.loclat;

				map.locToName(info.loclng, info.loclat, function (addr) {
					cb(addr);
				});
			} else {
				cb("(unsettled)");
			}
		};

		return ret;
	}

	function updateDomPos(dom) {
		var cont = dom.find(".cover-cont");
		var cover = dom.find(".cover");

		var r1 = cover.width() / cover.height();
		var r2 = cont.width() / cont.height();

		if (r1 > r2) {
			cover.css({
				"height": "100%",
				"width": "auto",
				"top": "0",
				"left": -(Math.abs(r1 - r2) / r2 / 2 * 100) + "%"
			});
		} else {
			// alert((-(1 / r1 - 1 / r2) / 2 * 100));
			cover.css({
				"width": "100%",
				"height": "auto",
				"left": "0",
				"top": -(Math.abs(1 / r1 - 1 / r2) / (1 / r2) / 2 * 100) + "%"
			});
		}
	}

	function setDom(dom, info, config) {
		config = config || {};
		dom = $(dom);

		var parsed = parseInfo(info, config);

		dom.find(".cover").attr("src", parsed.cover).on("load", function () {
			updateDomPos(dom);
		});

		dom.find(".title").html(parsed.title);
		dom.find(".date").html(parsed.date);
		dom.find(".description").html(parsed.descr);
		dom.find(".apply_num").html(parsed.apply_num);

		if (parsed.favtag.length || config.editTag) {
			dom.find(".favtag").css("display", "").html("");

			env.favtag(function (tags) {
				var box = tagbox.init(dom.find(".favtag"), tags, { onChange: config.onTagChange })
				
				box.set(parsed.favtag);
			
				if (config.editTag) {
					box.openEdit();
				}
			});
		} else {
			dom.find(".favtag").css("display", "none");
		}

		var dom_util = {
			changeCover: function (cover) {
				dom.find(".cover").attr("src", foci.download(parsed.cover));
			}
		};

		if (config.onCoverClick) {
			dom.find(".cover").css("cursor", "pointer");
			dom.find(".cover").click(function () {
				config.onCoverClick(dom_util);
			});
		}
	}

	/* waterfall view of events */
	/* for search results and listing */
	function init(cont, config) {
		cont = $(cont);
		config = $.extend({}, lim_config, {
			max_descr_len: 64,
			view: function (info) {
				qview(info, null, mod);
			},

			loader_only_on_buffer: false // only show loader when buffering(not on the beginning)

			// fetch: {
			//     fetch: function (skip, cb(suc, dat)),
			//     cont: the scroll container,
			//     no_more_prompt: prompt shown when no more event is loaded
			// }
		}, config);

		var main = $("<div class='com-event'></div>");

		/* init waterfall */
		var wf = waterfall.init(main, { onUpdate: config.onUpdate });

		cont.append(main);

		function genEvent(info) {
			var main = eventTemplate();

			main.find(".cover, .header, .description").click(function () {
				config.view(info);
			});

			main.css("opacity", "0");
			main.css("pointer-events", "none");
			main.find(".loader").addClass("active");

			var loaded = false;

			// main.ready(function () {
			// 	if (!loaded) {
			// 		// wf.update();
			// 		// main.css("opacity", "0.2");
			// 	}
			// });

			// main.css("opacity", "0.4");

			main.find(".cover").ready(function () {
				if (!loaded) {
					wf.update();
					main.css("opacity", "0.4");
				}
			}).on("load", function () {
				loaded = true;
				wf.update();
				main.find(".loader").removeClass("active");
				setTimeout(function () {
					main.css("opacity", "1");
					main.css("pointer-events", "");
				}, 200);
			});

			setDom(main, info, config);

			return main;
		}

		var events = [];
		var edom = []; // event dom

		var mod = {};

		// interfaces
		mod.add = function (info) {
			var dom;
			
			events.push(info);

			dom = genEvent(info);
			edom.push(dom);
			
			wf.add(dom);
		};

		mod.clear = function (cb) {
			events = [];
			edom = [];

			clearFetch();

			mod.hide(function () {
				wf.clear();
				mod.show(cb);
			});
		};

		mod.hide = function (cb) {
			main.addClass("hide");
			setTimeout(cb, 300);
		};

		mod.show = function (cb) {
			// main.css("display", "");
			util.atimes(wf.update, 20);
			setTimeout(function () {
				main.removeClass("hide");
				if (cb) cb();
			}, 200);
		};

		// refresh info
		mod.update = function () {
			for (var i = 0; i < edom.length; i++) {
				setDom(edom[i], events[i], config);
			}
		};

		function bottomBar() {
			var bar = $(' \
				<div class="flow-loader"> \
					<div class="ui active centered inline loader" style="display: none;"></div> \
					<div class="prompt" style="display: none;"></div> \
				</div> \
			')

			bar.setLoader = function () {
				bar.find(".loader").css("display", "");
				bar.find(".prompt").css("display", "none");
			};

			bar.setPrompt = function (msg) {
				bar.find(".loader").css("display", "none");
				bar.find(".prompt").css("display", "").html(msg);
			};

			return bar;
		}

		function clearFetch() {
			fetch_skip = 0;
			if (fetch_loader) fetch_loader.remove();
			fetch_loader = null;
			fetch_lock = false;
		}

		var fetch_skip = 0;
		var fetch_loader = null;
		var fetch_lock = false;

		mod.fetch = function (cb) {
			if (!config.fetch) {
				util.emsg("$impossible(fetch function is not set for the current container)");
				return;
			}

			if (fetch_loader) return; // already loading

			// console.log("load");

			// set bottom loader icon
			var bar = bottomBar();
			fetch_loader = bar; // as a sign to prevent reload
			main.append(bar);

			// alert(edom.length);
			if (edom.length || !config.loader_only_on_buffer)
				bar.setLoader();

			config.fetch.fetch(fetch_skip, function (suc, dat) {
				if (suc) {
					fetch_skip += dat.length;
					for (var i = 0; i < dat.length; i++)
						mod.add(dat[i]);
				} else {
					util.emsg(dat);
				}

				suc = suc && dat.length > 0;

				if (!suc) {
					bar.setPrompt(config.fetch.no_more_prompt);
					// no unlock
				} else {
					bar.remove();
					fetch_loader = null; // unlock fetch
				}

				if (cb) cb(suc);
			});
		};

		if (config.fetch) {
			util.scrollBottom($(config.fetch.cont), 3, function (com) {
				if (fetch_lock || fetch_loader) return;
				fetch_lock = true;
				
				mod.fetch(function () {
					com.toBottom(4); // to avoid duplicated loadings
					fetch_lock = false;
				});

				com.toBottom();
			});
		}

		return mod;
	}

	/* event quick view */
	function qview(info, config, event) {
		info = info || {};
		config = $.extend({}, lim_config, config);

		var main = $(" \
			<div class='com-eqview ui small modal'> \
				<div class='cover' style='border-radius: 3px 3px 0 0;'></div> \
				<div class='cover-edit'>Change cover</div> \
				<div class='logo-cont'> \
					<div class='logo'><div>Change logo</div></div> \
					<div class='title'></div><br> \
					<div class='rating'></div><br> \
					<div class='detail'><i class='map outline icon'></i><span class='location'></span></div> \
					<div class='detail'><i class='calendar outline icon'></i><span class='time'></span></div> \
				</div> \
				<div class='back not-owner'> \
					<div class='util close ui icon button'> \
						<i class='close icon'></i> \
					</div><div class='util setting ui icon button'> \
						<i class='setting-btn setting icon'></i> \
					</div> \
				</div> \
				<div class='cont'> \
					<div class='descr'> \
					</div> \
					<div class='tagbox' style='margin-top: 0;'></div> \
					<!--div class='ui horizontal divider'>organizer</div> \
					<div class='orgs'> \
					</div--> \
				</div> \
				<button class='ui button more' style='width: 100%; border-radius: 0 0 3px 3px; height: 4rem; opacity: 0.7;'>MORE</button> \
			</div> \
		");

		var tgbox = null;

		var rat = rating.init(main.find(".rating"));

		if (info.euid) {
			main.find(".more").click(function () {
				main.modal("hide all");
				util.jump("#event/" + info.euid);
			});
		}

		// update info
		function updateInfo(info) {
			var parsed = parseInfo(info, config);

			parsed.location(function (addr) {
				main.find(".location").html(addr);
			});

			main.find(".cover").css("background-image", "url('" + parsed.cover + "')");
			main.find(".logo").css("background-image", "url('" + parsed.logo + "')");

			main.find(".title").html(parsed.title);
			rat.set(parsed.rating || 0.0);

			main.find(".time").html(parsed.date);

			main.find(".descr").html(parsed.descr);

			main.find(".back .util.close").click(function () {
				main.modal("hide");
			});

			/* update organizer */

			var ava;
			var orgs = main.find(".orgs");
			var fill = util.fill();
			orgs.html(fill);

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
						if (!suc) {
							util.emsg(dat);
							dat = null;
						}

						avatar.init(ava, dat, {
							size: size,
							onClick: function () {
								main.modal("hide all");
							}
						});

						fill.remove();
						orgs.prepend(ava);
					});
				}
			} else {
				fill.remove();
				orgs.html("<div class='tip'>no organizer</div>");
			}

			if (info.favtag) {
				util.await(function () { return tgbox !== null; }, function () {
					tgbox.set(info.favtag);
				});
			}

			// check is owner
			if (env.session()) {
				env.user(function (user) {
					if (info.org && info.org.indexOf(user.uuid) != -1) {
						main.find(".back").removeClass("not-owner");
					} else {
						main.find(".back").addClass("not-owner");
					}
				});
			}
		}

		// setting
		function enableSetting() {
			var setting_open = false;
			var discard = false;
			var ask_open = false;

			main.modal({
				autofocus: false,
				onHide: function () {
					if (ask_open) return false;

					if (main.hasClass("setting") && !discard) {
						ask_open = true;
						util.ask("Are you sure to discard all the changes?", function (ans) {
							ask_open = false;
							if (ans) {
								discard = true;
								main.modal("hide");
							}
						});

						return false;
					}
				}
			});

			function editText(com, cb) {
				com = $(com);
				var editor = $("<textarea class='editor-text'></textarea>");

				editor.val(com.html());
			
				function updatePos() {
					var ofs = com.offset();
					var mofs = main.offset();

					editor.css({
						position: "absolute",
						top: (ofs.top - mofs.top) + "px",
						left: (ofs.left - mofs.left) + "px",
						height: com.outerHeight(),
						width: com.outerWidth(),
						"font-size": com.css("font-size"),
						"font-family": com.css("font-family"),
						"font-weight": com.css("font-weight"),
						"line-height": com.css("line-height")
					});
				}

				updatePos()

				main.append(editor);
				editor.focus();

				$(window).on("resize", updatePos);

				editor.blur(function () {
					var val = editor.val();

					$(window).off("resize", updatePos);
					editor.remove();
					
					if (cb) cb(val);
				});
			}

			var exc_state = false;
			function exclude(cb) {
				if (exc_state) return;
				exc_state = true;
				cb(function () { exc_state = false; });
			}

			var changes;

			function editable(elem, type, field, cb) {
				elem = $(elem);
				elem.click(function () {
					if (!main.hasClass("setting")) return;

					exclude(function (unlock) {
						switch (type) {
							case "text":
								editText(elem, function (cont) {
									changes[field] = cont;
									if (cb) cb(cont);
									unlock();
								});
								break;

							case "image":
								upload.init(function (file) {
									if (file) {
										changes[field] = file;
										if (cb) cb(file);
									}
									
									unlock();
								});
								break;
						}
					});
				});
			}

			/*** editable fields ***/
			editable(main.find(".title"), "text", "title", function (cont) {
				main.find(".title").html(cont);
			});

			editable(main.find(".descr"), "text", "descr", function (cont) {
				main.find(".descr").html(cont);
			});

			editable(main.find(".cover-edit"), "image", "cover", function (cont) {
				main.find(".cover").css("background-image", "url('" + foci.download(cont) + "')");
			});

			editable(main.find(".logo"), "image", "logo", function (cont) {
				main.find(".logo").css("background-image", "url('" + foci.download(cont) + "')");
			});

			env.favtag(function (tags) {
				tgbox = tagbox.init(main.find(".tagbox"), tags || []);

				// if (tags) {
				// 	for (var i = 0; i < tags.length; i++) {
				// 		main.find(".tagadd-btn .menu").append(" \
				// 			<div class='item t-" + tags[i] + "' data-value='" + tags[i] + "'>" + tags[i] + " \
				// 		</div>");
				// 	}
				// }
			});

			/*** editable fields ***/

			function openSetting() {
				offproc();

				changes = {};

				setting_open = true;

				main.addClass("setting");

				main.find(".back .util.setting")
					.attr("data-content", "Click components to edit");
				
				main.find(".back .util .setting-btn")
					.removeClass("setting")
					.addClass("checkmark");

				main.modal("refresh");
			
				util.await(function () { return tgbox !== null; }, function () {
					tgbox.openEdit();
				});

				setTimeout(function () {
					main.find(".back .util.setting")
						.popup({
							position: "right center",
							hideOnScroll: true,
							on: "manual",
							inline: true,
							lastResort: true /* force show */
						})
						.popup("show");

					onproc();
				}, 500);
			}

			function saveChanges(session, cb) {
				if (!util.kcount(changes)) {
					cb(true);
					return;
				}

				if (tgbox && tgbox.hasChanged()) {
					changes.favtag = tgbox.cur();
				}

				foci.encop(session, $.extend(changes, {
					int: "event",
					action: "setinfo",
					euid: info.euid
				}), function (suc, dat) {
					if (!suc) {
						util.emsg(dat);
						cb(false);
					} else {
						foci.get("/event/info", { euid: info.euid }, function (suc, dat) {
							if (suc) {
								$.extend(info, dat);
							} else {
								util.emsg(dat);
							}

							cb(suc);
						});
					}
				});
			}

			function closeSetting() {
				offproc();

				main.find(".back .util .setting-btn")
					.removeClass("checkmark");
				
				main.find(".back .util.setting").addClass("loading");

				function close() {
					main.removeClass("setting");

					main.find(".back .util.setting").removeClass("loading");
					
					main.find(".back .util .setting-btn")
						.removeClass("refresh")
						.addClass("setting");

					util.await(function () { return tgbox !== null; }, function () {
						tgbox.closeEdit();
					});

					main.find(".back .util.setting").popup("hide");
					// main.modal({ closable: true });
					main.modal("refresh");

					setting_open = false;

					// update event cards
					if (event) event.update();

					onproc();
				}

				function fail() {
					main.find(".back .util.setting")
						.removeClass("loading")
						.popup("change content", "Click here to retry");

					main.find(".back .util .setting-btn")
						.addClass("refresh");
				
					// not set session_open
					onproc();
				}

				var session = env.session();

				if (!session) {
					login.init(function (dat) {
						if (dat) closeSetting(); // redo the saving
					});
				} else {
					saveChanges(session, function (suc) {
						if (suc) {
							close();
							updateInfo(info);
						} else fail();
					})
				}
			}

			var proc = function () {
				if (setting_open) {
					closeSetting();
				} else {
					openSetting();
				}
			};

			var offproc = function () {
				main.find(".back .util.setting").off("click", proc);
			};

			var onproc = function () {
				main.find(".back .util.setting").on("click", proc);
			};

			onproc();
		}

		updateInfo(info);
		enableSetting();

		main.ready(function () { main.modal("show"); });
	}

	return {
		init: init,
		qview: qview,
		genDate: genDate,
		eventTemplate: eventTemplate,
		setDom: setDom,
		parseInfo: parseInfo
	}
});
