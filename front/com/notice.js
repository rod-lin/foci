/* notice */

"use strict";

define([ "com/util", "com/login", "com/lang", "com/xfilt" ], function (util, login, lang, xfilt) {
	foci.loadCSS("com/notice.css");

	// notice editor
	function editor(config) {
		config = $.extend({}, config);

		var main = $(" \
			<div class='com-notice-edit ui small modal'> \
				<div style='padding: 3rem; padding-bottom: 0;'> \
					<div class='top-prompt'>Hello</div> \
					<div class='edit-header'> \
						<div class='logo'></div> \
						<div style='width: 100%; padding-left: 5rem;'> \
							<input class='title-input input-no-style' placeholder='Title' /> \
						</div> \
					</div> \
					<textarea class='msg input-no-style' placeholder='Message'></textarea> \
				</div> \
				<div style='text-align: right;'> \
					<div class='ui buttons' style='padding: 1rem;'> \
						<button class='ui button cancel-btn'>Cancel</button> \
						<button class='ui blue button send-btn'>Send</button> \
					</div> \
				</div> \
			</div> \
		");

		if (config.logo)
			util.bgimg(main.find(".logo"), config.logo);

		if (config.prompt)
			main.find(".top-prompt").html(config.prompt);

		function ask() {
			if (main.find(".title-input").val() || main.find(".msg").val())
				util.ask("Are you sure to discard this message?", function (ans) {
					can_hide = ans;

					if (ans) {
						main.modal("hide");
					}
				});
			else {
				can_hide = true;
				main.modal("hide");
			}
		}

		main.find(".title-input").keydown(function (e) {
			if (e.which == 13)
				util.nextTick(function () { main.find(".msg").focus(); });
		});

		main.find(".cancel-btn").click(ask);
		main.find(".send-btn").click(function () {
			if (config.onSend) {
				main.find(".send-btn").addClass("loading");

				config.onSend({
					title: main.find(".title-input").val(),
					msg: main.find(".msg").val()
				}, function (suc) {
					main.find(".send-btn").removeClass("loading");

					if (suc) {
						can_hide = true;
						main.modal("hide");
					}
				});
			}
		});

		var can_hide = false;

		main
			.modal({
				onHide: function () {
					if (!can_hide) {
						ask();
						return false;
					}
				}
			})
			.modal("show");

		var ret = {};

		return ret;
	}

	function modal(msg, config) {
		config = $.extend({}, config);

		var main = $(" \
			<div class='com-notice-view ui small modal'> \
				<div class='nt-header'> \
					<div class='logo'></div> \
					<div class='detail'> \
						<div class='title'></div> \
						<div class='date'></div> \
						<div class='sender'></div> \
					</div> \
				</div> \
				<div class='cont'></div> \
				<div style='text-align: right;'> \
					<div class='ui right buttons' style='float: right; padding: 1rem;'> \
						<button class='ui button'>Contact</button> \
						<button class='ui green button yep-btn'>Yep</button> \
					</div> \
				</div> \
			</div> \
		");

		util.bgimg(main.find(".nt-header .logo"), config.info.logo);

		main.find(".nt-header .title").html(msg.title);

		main.find(".nt-header .sender").html("by " + config.info.name);
		main.find(".nt-header .date").html(util.localDate(new Date(msg.date)));
		main.find(".cont").html(xfilt(msg.msg));

		main.modal({
			onHide: function () {
				if (config.onHide)
					config.onHide();
			}
		});

		main.find(".yep-btn").click(function () {
			main.modal("hide");
		});

		main.modal("show");

		var ret = {};

		return ret;
	}

	function init(cont, config) {
		cont = $(cont);
		config = $.extend({}, config);
	
		var main = $(" \
			<div class='com-notice'> \
				<div class='nt-view'> \
					<div class='nt-box'></div> \
					<div class='nt-all'> \
						<div class='nt-tbar'> \
							<div class='back-btn'><i class='chevron left icon fitted'></i></div> \
							<div class='sender-logo'></div> \
							<div class='sender-name'></div> \
						</div> \
						<div class='history'> \
						</div> \
					</div> \
					<div class='ui loader'></div> \
				</div> \
				<div class='ui two bottom attached buttons'> \
					<button class='ui basic button refresh-btn'>refresh</button> \
				</div> \
			</div> \
		");

		main.find(".nt-all .back-btn").click(function () {
			main.removeClass("view-all");
		});

		var no_hide = false;

		function parseMsg(dat) {
			var items = [];

			for (var k in dat) {
				if (dat.hasOwnProperty(k)) {
					items.push(dat[k]);
					for (var i = 0; i < dat[k].length; i++) {
						dat[k][i].date = new Date(dat[k][i].date);
						dat[k][i].title = lang.msg(dat[k][i].title || "$core.notice.untitled");
					}
				}
			}

			items.sort(function (a, b) {
				return b.last().date - a.last().date;
			});

			var ret = {};

			ret.dat = items;
			ret.preview = [];

			for (var i = 0; i < items.length; i++) {
				ret.preview.push(items[i].last());
			}
		
			return ret;
		}

		function genHist(msg, info) {
			var item = $(" \
				<div class='hist-msg'> \
					<div class='header'> \
						<div class='title'>" + msg.title + "</div> \
						<div class='date'>" + util.localDate(msg.date) + "</div> \
					</div> \
					<div class='msg'>" + msg.msg + "</div> \
				</div>\
			");

			item.click(function () {
				no_hide = true;
				modal(msg, {
					info: info,
					onHide: function () {
						util.nextTick(function () {
							no_hide = false;
						});
					}
				});
			});

			return item;
		}

		function genPreview(msg, hist) {
			var item = $(" \
				<div class='nt-item'> \
					<div class='sender-logo'></div> \
					<div class='nt-preview'> \
						<div class='sender-name'></div> \
						<div class='sender-msg'></div> \
					</div> \
				</div> \
			");

			item.find(".sender-msg").html(msg.title + ": " + msg.msg);
		
			// console.log(msg);

			login.session(function (session) {
				foci.encop(session, {
					int: "notice",
					action: "info",
					type: msg.type,
					sender: msg.sender
				}, function (suc, dat) {
					if (suc) {
						// console.log(dat);

						if (dat.logo) {
							if (!dat.url)
								dat.logo = foci.download(dat.logo);
						} else dat.logo = "/img/def/logo.jpg"

						dat.name = lang.msg(dat.name);

						util.bgimg(item.find(".sender-logo"), dat.logo);
						item.find(".sender-name").html(dat.name);

						item.click(function () {
							util.bgimg(main.find(".nt-all .nt-tbar .sender-logo"), dat.logo);
							main.find(".nt-all .nt-tbar .sender-name").html(dat.name);

							main.find(".nt-all .history").html("");

							// console.log(hist);
							for (var i = hist.length - 1; i >= 0; i--) {
								main.find(".nt-all .history").append(genHist(hist[i], dat));
							}

							main.addClass("view-all");
						});
					} else {
						util.emsg(dat);
					}
				});
			});

			return item;
		}

		function refresh() {
			main.removeClass("view-all");
			main.find(".nt-view .loader").addClass("active");

			login.session(function (session) {
				if (!session) return;

				foci.encop(session, {
					int: "notice",
					action: "pull"
				}, function (suc, dat) {
					if (suc) {
						var parsed = parseMsg(dat);

						main.find(".nt-box").html("");

						for (var i = 0; i < parsed.preview.length; i++) {
							main.find(".nt-box").append(genPreview(parsed.preview[i], parsed.dat[i]));
						}

						if (!parsed.preview.length)
							main.find(".nt-box").html("<div class='prompt'>no notice</div>");

						main.find(".nt-view .loader").removeClass("active");
					} else {
						util.emsg(dat);
					}
				});
			});
		}

		function keep(cb) {
			login.session(function (session) {
				if (!session) return;

				foci.encop(session, {
					int: "notice",
					action: "updatel"
				}, function (suc, dat) {
					if (suc) cb(true);
					else cb(false);

					util.nextTick(function () {
						keep(cb);
					});
				});
			});
		}

		main.find(".refresh-btn").click(refresh);

		cont.append(main);

		var ret = {};

		ret.canHide = function () { return !no_hide; };
		ret.refresh = refresh;

		ret.hasUpdate = function (cb) {
			login.session(function (session) {
				if (!session) return;

				foci.encop(session, {
					int: "notice",
					action: "update"
				}, function (suc, dat) {
					if (suc) {
						cb(dat);
					} else {
						util.emsg(dat);
						cb(false);
					}
				});
			});
		};

		ret.keepUpdate = function (cb) {
			keep(cb);
		};

		return ret;
	}

	return { init: init, editor };
});
