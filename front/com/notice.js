/* notice */

"use strict";

define([
	"com/util", "com/login", "com/lang",
	"com/xfilt", "com/userhunt", "com/popselect",
	"com/holdon"
], function (util, login, lang, xfilt, userhunt, popselect, holdon) {
	foci.loadCSS("com/notice.css");

	// notice editor
	function editor(config) {
		config = $.extend({
			is_admin: false,
			/* onSend */
			/* logo */
			/* prompt */
			
			use_dragi: false
		}, config);

		var main = $(" \
			<div class='com-notice-edit ui small modal'> \
				<div style='padding: 2.5rem; padding-bottom: 0;'> \
					<div class='top-prompt'></div> \
					<div class='edit-header'> \
						<div class='logo'></div> \
						<div style='width: 100%; padding-left: 5rem;'> \
							<input class='title-input input-no-style' placeholder='Title' /> \
						</div> \
					</div> \
					<textarea class='msg input-no-style' placeholder='Message'></textarea> \
				</div> \
				<div style='text-align: right;'> \
					<div class='ui buttons' style='padding: 1rem 2rem 2rem 0;'> \
						<button class='ui button cancel-btn'>Cancel</button> \
						<button class='ui blue button send-btn'>Send</button> \
					</div> \
				</div> \
			</div> \
		");
		
		var selected_sender = null;

		if (config.is_admin) {
			main.find(".logo").addClass("selectable");
			
			function selectSender(sender) {
				return function () {
					login.session(function (session) {
						foci.encop(session, {
							int: "notice",
							action: "info",
							type: "system",
							sender: sender
						}, function (suc, dat) {
							if (suc) {
								if (dat.logo) {
									if (!dat.url)
										dat.logo = foci.download(dat.logo);
								} else dat.logo = "/img/def/logo.jpg";
								
								util.bgimg(main.find(".logo"), dat.logo);
								
								selected_sender = sender;
							} else {
								util.emsg(dat);
							}
						});
					});
				};
			}
			
			popselect.init(main.find(".logo"), [
				{
					cont: "Helper",
					onSelect: selectSender("helper")
				},
				
				{
					cont: "Review",
					onSelect: selectSender("review")
				}
			]);
		}

		if (config.logo)
			util.bgimg(main.find(".logo"), config.logo);

		if (config.prompt)
			main.find(".top-prompt").html(config.prompt);

		function hide() {
			if (config.use_dragi) {
				main.dragi("close");
			} else {
				main.modal("hide");
			}
		}

		function ask() {
			if (main.find(".title-input").val() || main.find(".msg").val())
				util.ask("Are you sure to discard this message?", function (ans) {
					can_hide = ans;

					if (ans) {
						hide();
					}
				}, { use_dragi: config.use_dragi });
			else {
				can_hide = true;
				hide();
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
					sender: selected_sender,
					title: main.find(".title-input").val(),
					msg: main.find(".msg").val()
				}, function (suc) {
					main.find(".send-btn").removeClass("loading");

					if (suc) {
						can_hide = true;
						hide();
					}
				});
			}
		});

		var can_hide = false;

		if (config.use_dragi) {
			main.removeClass("ui small modal")
				.dragi({
					height: "auto",
					title: "New Notice",
					onClose: function () {
						if (!can_hide) {
							ask();
							return false;
						}
					}
				});
		} else {
			main.modal({
					allowMultiple: true,
					onHide: function () {
						if (!can_hide) {
							ask();
							return false;
						}
					}
				})
				.modal("show");
		}

		var ret = {};

		return ret;
	}

	function modal(msg, config) {
		config = $.extend({
			logo_url: null,
			use_dragi: false
		}, config);

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
					<div class='ui right buttons' style='float: right; padding: 1rem 2rem 2rem 0;'> \
						<!--button class='ui button'>Contact</button--> \
						<button class='ui green button yep-btn'>Yep</button> \
					</div> \
				</div> \
			</div> \
		");

		util.bgimg(main.find(".nt-header .logo"), config.info.logo);
		
		if (config.logo_url) {
			main.find(".nt-header .logo").click(function () {
				main.modal("hide");
				util.jump(config.logo_url);
			});
		}

		main.find(".nt-header .title").html(msg.title).attr("title", util.htmlToText(msg.title));

		main.find(".nt-header .sender").html("by " + config.info.name);
		main.find(".nt-header .date").html(util.localDate(new Date(msg.date)));
		
		if (msg.format == "html")
			main.find(".cont").html(msg.raw);
		else
			main.find(".cont").html(xfilt(msg.msg));
		
		function hide() {
			if (config.use_dragi) {
				main.dragi("close");
			} else {
				main.modal("hide");
			}
		}
		
		main.find(".yep-btn").click(function () {
			hide();
		});

		if (config.use_dragi) {
			main.removeClass("ui small modal")
				.dragi({
					height: "auto",
					onClose: function () {
						if (config.onHide)
							config.onHide();
					},
					
					title: util.htmlToText(msg.title)
				});
		} else {
			main.modal({
				onHide: function () {
					if (config.onHide)
						config.onHide();
				}
			});

			main.modal("show");
		}

		var ret = {};

		return ret;
	}

	function init(cont, config) {
		cont = $(cont);
		config = $.extend({
			is_admin: false,
			use_dragi: false,
			
			// onUnread
			// onAllRead
		}, config);

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
					<button class='ui basic button new-btn' style='display: none !important;'>new</button> \
					<button class='ui basic button refresh-btn'>refresh</button> \
				</div> \
			</div> \
		");
		
		var cur_preview = null;

		main.find(".nt-all .back-btn").click(function () {
			main.removeClass("view-all");
			
			if (cur_preview) {
				// var unread = false;
				
				// // check if any history message is unread
				// for (var i = 0; i < cur_preview.hist.length; i++) {
				// 	if (cur_preview.hist[i].unread) unread = true;
				// }
				
				// if (!unread) {
				// 	cur_preview.dom.removeClass("unread");
				// }
				
				// cur_preview = null;
				
				updateUnreadState();

				cur_preview = null;
			}
		});

		var no_hide = false;

		function parseMsg(dat) {
			var items = [];

			for (var k in dat) {
				if (dat.hasOwnProperty(k)) {
					items.push(dat[k]);
					for (var i = 0; i < dat[k].length; i++) {
						dat[k][i].date = new Date(dat[k][i].date);
						dat[k][i].title = xfilt(lang.msg(dat[k][i].title || "$core.notice.untitled"));
						dat[k][i].raw = lang.msg(dat[k][i].msg);
						dat[k][i].msg = xfilt(lang.msg(dat[k][i].msg));
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
		
		function updateUnreadState() {
			if (cur_preview && !cur_preview.dom.find(".hist-msg.unread").length)
				cur_preview.dom.removeClass("unread");

			if (main.find(".hist-msg.unread, .nt-item.unread").length) {
				if (config.onUnread) config.onUnread();
			} else {
				if (config.onAllRead) config.onAllRead();
			}
		}

		function genHist(msg, info, i) {
			var item = $(" \
				<div class='hist-msg'> \
					<div class='header'> \
						<div class='title'>" + xfilt(msg.title) + "</div> \
						<div class='date'>" + util.localDate(msg.date) + "</div> \
					</div> \
					<div class='msg'>" + xfilt(msg.msg) + "</div> \
					<div class='hist-reddot'></div> \
				</div>\
			");
			
			if (msg.unread) {
				item.addClass("unread");
			}

			item.click(function () {
				no_hide = true;
				
				modal(msg, {
					info: info,
					onHide: function () {
						util.nextTick(function () {
							no_hide = false;
						});
					},
					
					use_dragi: config.use_dragi,
					
					logo_url:
						msg.type == "event" ? "#event/" + msg.sender
					: ( msg.type == "club" ? "#clubcent/" + msg.sender
					:   null)
				});
				
				if (msg.unread) {
					login.session(function (session) {
						if (session) foci.encop(session, {
							int: "notice",
							action: "setread",
							
							type: msg.type,
							sender: msg.sender,
							which: i
						}, function (suc, dat) {
							if (suc) {
								item.removeClass("unread");
								msg.unread = false;
								
								updateUnreadState();
							} else {
								util.emsg(dat);
							}
						});
					});
				}
			});
			
			item.attr("title", util.htmlToText(xfilt(msg.title)));

			return item;
		}

		function genPreview(msg, hist, is_new) {
			var item = $(" \
				<div class='nt-item'> \
					<div class='sender-logo'> \
						<div class='nt-reddot'></div> \
					</div> \
					<div class='nt-preview'> \
						<div class='sender-name'></div> \
						<div class='sender-msg'></div> \
					</div> \
				</div> \
			");
			
			var unread = false;
			
			if (hist) for (var i = 0; i < hist.length; i++) {
				if (hist[i].unread) unread = true;
			}
			
			if (unread) {
				item.addClass("unread");
			}

			item.find(".sender-msg").html(xfilt(msg.title + ": " + msg.msg));

			item.attr("title", util.htmlToText(msg.title));

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
						} else dat.logo = "/img/def/logo.jpg";

						dat.name = xfilt(lang.msg(dat.name));

						util.bgimg(item.find(".sender-logo"), dat.logo);
						item.find(".sender-name").html(dat.name);

						item.click(function () {
							util.bgimg(main.find(".nt-all .nt-tbar .sender-logo"), dat.logo);
							main.find(".nt-all .nt-tbar .sender-name").html(dat.name);

							main.find(".nt-all .history").html("");

							// console.log(hist);
							for (var i = hist.length - 1; i >= 0; i--) {
								main.find(".nt-all .history").append(genHist(hist[i], dat, i));
							}
							
							cur_preview = {
								hist: hist,
								dom: item
							};

							main.addClass("view-all");
						});
					} else {
						util.emsg(dat);
					}
				});
			});

			return item;
		}
		
		var new_count = 0;

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
							main.find(".nt-box").append(genPreview(parsed.preview[i], parsed.dat[i], i < new_count));
						}
						
						new_count = 0;

						if (!parsed.preview.length)
							main.find(".nt-box").html("<div class='prompt'>no notice</div>");

						main.find(".nt-view .loader").removeClass("active");
						
						updateUnreadState();
					} else {
						util.emsg(dat);
					}
				});
			});
		}

		var keep_err = 0;

		function keep(cb) {
			holdon.reg("notice", {
				proc: function (dat) {
					cb(dat);
				}
			});

			// login.session(function (session) {
			// 	if (!session) return;
				
			// 	var now = new Date();
			// 	var delay = 1000;

			// 	foci.encop(session, {
			// 		int: "notice",
			// 		action: "updatel"
			// 	}, function (suc, dat) {
			// 		if (suc) {
			// 			if (dat)
			// 				new_count++;
			// 			else
			// 				delay = 10000; // delay 10 seconds

			// 			cb(dat);
			// 			keep_err = 0;
			// 		} else {
			// 			cb(false);
			// 			keep_err++;
			// 		}

			// 		if (keep_err > 5 &&
			// 			(new Date()) - now < 3000) {
			// 			// request time less than 3 sec
			// 			delay = 60000;
			// 		}

			// 		setTimeout(function () {
			// 			keep(cb);
			// 		}, delay);
			// 	});
			// });
		}

		main.find(".refresh-btn").click(refresh);
		
		function newSystemNotice() {
			var select_btn = $("<a>Select user</a>");
			var selected = [];
			
			var edit = editor({
				is_admin: true,
				prompt: select_btn,
				onSend: function (dat, cb) {
					if (!dat.sender) {
						util.emsg("no sender");
						cb(false);
						return;
					}
					
					login.session(function (session) {
						foci.encop(session, {
							int: "notice",
							action: "send",
							type: "system",

							sender: dat.sender,
							uuids: selected,

							title: dat.title,
							msg: dat.msg
						}, function (suc, dat) {
							if (suc) {
								util.emsg("notice has been sent", "success");
							} else {
								util.emsg(dat);
							}

							cb(suc);
						});
					});
				},
				
				use_dragi: config.use_dragi
			});
			
			select_btn.click(function () {
				userhunt.modal(selected, function (uuids) {
					if (uuids.length) {
						select_btn.html(uuids.length + " user" + (uuids.length > 1 ? "s" : "") + " selected");
					} else {
						select_btn.html("Select user");
					}
					
					selected = uuids;
				}, {
					prompt: "Send notice to",
					just_one: false,
					use_dragi: config.use_dragi
				});
			});
		}
		
		if (config.is_admin) {
			main.find(".new-btn").click(newSystemNotice);
		}

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
						new_count += dat;
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

		ret.setAdmin = function () {
			main.find(".new-btn").css("display", "");
			main.find(".new-btn").off("click").click(newSystemNotice);
		};

		return ret;
	}

	return { init: init, editor: editor };
});
