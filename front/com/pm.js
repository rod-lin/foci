/* personal message */

define([
	"com/util", "com/login", "com/xfilt",
	"com/lang", "com/userhunt", "com/holdon"
], function (util, login, xfilt, lang, uh, holdon) {
	foci.loadCSS("com/pm.css");
	foci.loadCSS("com/chatbox.css");

	function parseConv(me, all) {
		var ret = {};

		for (var i = 0; i < all.length; i++) {
			var k;

			if (all[i].sender == me) {
				k = all[i].sendee;
			} else {
				k = all[i].sender;
			}

			if (!ret[k])
				ret[k] = [ all[i] ];
			else
				ret[k].push(all[i]);
		}

		return ret;
	}

	function chatbox(sendee, config) {
		config = $.extend({
			use_dragi: false
		}, config)
		
		var main = $(" \
			<div class='com-pm-chatbox ui small modal'> \
				<div class='cont'> \
					<div class='header'> \
						<div class='sendee-avatar'></div> \
						<div class='sendee-info'> \
							<div class='sendee-name'></div> \
							<div class='sendee-intro'></div> \
						</div> \
					</div> \
					<div class='msg-box'> \
						<div class='ui loader active'></div> \
						<div class='history'> \
							<div class='load-more-btn'> \
								<a>Load more</a> \
								<div class='ui active inline mini loader'></div> \
							</div> \
						</div> \
					</div> \
					<div class='input-area'> \
						<textarea class='input'></textarea> \
						<div class='btn-area ui vertical buttons'> \
							<button class='send-btn ui blue basic button'>send</button> \
							<button class='back-btn ui basic button'>back</button> \
						</div> \
					</div> \
				</div> \
			</div> \
		");

		var sendee_info = null;

		function getSendee(cb) {
			if (sendee_info) {
				cb(sendee_info);
				return;
			}
			
			util.userInfo(sendee, function (dat) {
				sendee_info = dat = login.parseInfo(dat);
				util.bgimg(main.find(".header .sendee-avatar"), dat.avatar);
				main.find(".header .sendee-name").html(dat.dname);
				main.find(".header .sendee-intro").html(dat.intro);
				if (cb) cb(dat);
			}, function () {
				if (cb) cb(login.parseInfo({}));
			});
		}
		
		getSendee();

		function genMsg(sender, text) {
			var msg = $(" \
				<div class='msg-bar'> \
					<div class='msg-avatar'></div> \
					<div class='msg-cont'> \
						<div class='sender'></div> \
					</div> \
				</div> \
			");

			if (text instanceof Array) {
				// console.log(text);
				for (var i = 0; i < text.length; i++) {
					msg.find(".msg-cont").append("<div class='msg'>" + xfilt(text[i]) + "</div><br>");
				}
			} else {
				msg.find(".msg-cont").append("<div class='msg'>" + xfilt(text) + "</div>");
			}

			if (sender) {
				getSendee(function (sendee) {
					msg.find(".sender").html(sendee.dname);
					util.bgimg(msg.find(".msg-avatar"), sendee.avatar);
				});
			} else {
				// self
				msg.find(".sender").html("me");
				msg.addClass("self");
			}

			msg.ready(function () {
				msg.addClass("show");
			});

			return msg;
		}

		function formatDate(date) {
			return "<div class='date'>" + util.localDate(date) + "</div>";
		}

		function needDate(prev, cur) {
			return !prev || cur.date - prev.date > 1000 * 30;
		}

		function loadHistory(cb) {
			login.session(function (session) {
				if (!session) {
					if (cb) cb(false);
					return;
				}
				
				// alert(first_uid);
				
				var cur_top = main.find(".msg-box").scrollTop();
				var cur_height = main.find(".history").height();
				var load_more = main.find(".load-more-btn");
				
				load_more.addClass("loading");

				foci.encop(session, {
					int: "pm",
					action: "getconv",
					sender: sendee,
					
					noafter: first_uid
				}, function (suc, dat) {
					main.find(".msg-box>.loader").removeClass("active").addClass("hidden");
					
					if (suc) {
						var self_uuid = session.getUUID();
						
						if (dat.length == 0) {
							// no more history
							load_more.addClass("no-more");
						}
						
						// sort from oldest to newest
						dat.sort(function (a, b) {
							return new Date(a.date) - new Date(b.date);
						});

						for (var i = 0; i < dat.length; i++) {
							dat[i].date = new Date(dat[i].date);

							if (needDate(i ? dat[i - 1] : null, dat[i])) {
								load_more.before(formatDate(dat[i].date));
							}

							load_more.before(genMsg(
								(dat[i].sender == self_uuid ? null : dat[i].sender),
								dat[i].msg
							));
							
							if (dat[i].sender == sendee) {
								last_uid = Math.max(last_uid, dat[i].pmuid);
							}
							
							// alert(dat[i].pmuid);
							
							// get the first date
							if (!first_uid)
								first_uid = dat[i].pmuid;
							else
								first_uid = Math.min(first_uid, dat[i].pmuid);
						}
						
						// reset load more
						main.find(".history").prepend(load_more);

						all_msg = dat.concat(all_msg);
						
						load_more.removeClass("loading");
					
						setTimeout(function () {
							// hope everything is ready
							// reset the scroller to the original position
							main.find(".msg-box").scrollTop(cur_top + main.find(".history").height() - cur_height);
						}, 100);
					} else {
						util.emsg(dat);
					}

					if (cb) cb(suc);
				});
			});
		}

		function send() {
			login.session(function (session) {
				if (!session) return;

				var msg = main.find(".input").val();
				main.find(".input").val("");

				if (!msg) return;

				var msgdom = genMsg(null, msg);

				var msgdat = { msg: msg, date: new Date() };
				var prev = all_msg.length ? all_msg[all_msg.length - 1] : null;

				if (needDate(prev, msgdat)) {
					main.find(".msg-box").append(formatDate(msgdat.date));
				}

				all_msg.push(msgdat);

				main.find(".msg-box")
					.append(msgdom)
					.ready(function () {
						util.bottom(main.find(".msg-box"));
					});

				foci.encop(session, {
					int: "pm",
					action: "send",
					sendee: sendee,
					text: msg
				}, function (suc, dat) {
					if (suc) {
						// TODO
					} else {
						util.emsg(dat);
						msgdom.addClass("error");
						msgdom.find(".sender").html(lang.msg(dat));
					}
				});
			});
		}

		var update_proc = null;
		var exit = false;

		var all_msg = [];
		
		var last_uid = 0;
		var first_uid = 0;

		function checkUpdate() {
			login.session(function (session) {
				if (!session) return;
				
				if (exit) return;
				
				foci.encop(session, {
					int: "pm",
					action: "updatel",
					sender: sendee
				}, function (suc, dat) {
					if (suc) {
						var self_uuid = session.getUUID();
					
						if (dat.length) {
							for (var i = dat.length - 1; i >= 0; i--) {
								dat[i].date = new Date(dat[i].date);
								var prev = i ? dat[i - 1] : (all_msg.length ? all_msg[all_msg.length - 1] : null);
					
								if (needDate(prev, dat[i])) {
									main.find(".msg-box").append(formatDate(dat[i].date));
								}
					
								all_msg.push(dat[i]);
								main.find(".msg-box").append(genMsg(dat[0].sender, dat[i].msg, dat[i]));
							
								last_uid = Math.max(last_uid, dat[i].pmuid);
							}
					
							main.find(".msg-box").ready(function () {
								util.bottom(main.find(".msg-box"));
							});
						}
					} else {
						if (dat != "$def.network_error")
							util.emsg(dat);
					}
					
					if (!exit)
						update_proc = setTimeout(checkUpdate, 10000);
				});
			});
		}

		loadHistory(function () {
			// util.bottom(main.find(".msg-box"));
			// setTimeout(function () {
			// 	main.find(".msg-box").scrollTop(main.find(".history").height());
			// }, 300);
		});
		
		main.find(".load-more-btn").click(function () {
			if ($(this).hasClass("loading")) return;
			loadHistory();
		});

		checkUpdate();

		function hide() {
			if (config.use_dragi) {
				main.dragi("close");
			} else {
				main.modal("hide");
			}
		}
		
		// inform server the last message received
		function closeUpdate() {
			login.session(function (session) {
				if (session) foci.encop(session, {
					int: "pm",
					action: "closel",
					
					sender: sendee,
					luid: last_uid
				}, function (suc, dat) {
					if (!suc) {
						util.emsg(dat);
					}
				});
			});
		}

		if (config.use_dragi) {
			main.removeClass("ui small modal")
				.dragi({
					height: "auto",
					onClose: function () {
						exit = true;
						clearTimeout(update_proc);
						
						closeUpdate();
					},
					
					title: "Chat"
				})
		} else {
			main.modal({
				// BUG: DO NOT set this(conflicts with userhunt modal)
				// allowMultiple: true
				onHide: function () {
					exit = true;
					clearTimeout(update_proc);
					
					closeUpdate();
				}
			}).modal("show");
		}
		
		main.find(".send-btn").click(send);
		main.find(".back-btn").click(function () {
			hide();
		});

		main.find(".sendee-avatar").click(function () {
			hide();
			util.jump("#profile/" + sendee);
		});

		main.find(".input").keydown(function (e) {
			if (e && e.which == 13) {
				if (!e.ctrlKey) {
					send();
					if (e.preventDefault) e.preventDefault();
				} else {
					var textarea = main.find(".input");
					var orig = textarea.val();

					if (textarea[0].selectionStart !== undefined) {
						var orig_sele = textarea[0].selectionStart;
						textarea[0].value = orig.substring(0, orig_sele) + "\n" +
											orig.substring(textarea[0].selectionEnd);

						textarea[0].selectionStart = textarea[0].selectionEnd = orig_sele + 1;
					} else {
						// TODO: buggy implementation
						textarea.val(orig + "\n");
					}
				}
			}
		});

		var ret = {};

		return ret;
	}

	function qview(cont, config) {
		cont = $(cont);
		config = $.extend({
			use_dragi: false
		}, config);

		var main = $(" \
			<div class='com-pm-qview'> \
				<div class='msg-box'> \
					<div class='msg-box-cont'></div> \
					<div class='prompt'></div> \
					<div class='main-loader ui loader active'></div> \
				</div> \
				<div class='bottom-bar'> \
					<div class='ui two bottom attached buttons' style='height: 100%;'> \
						<button class='ui basic button write-btn'><i class='write icon'></i>new</button> \
						<button class='ui basic button view-all-btn'>view all</button> \
					</div> \
				</div> \
			</div> \
		");

		cont.append(main);

		function setPrompt(msg) {
			main.find(".prompt").html(msg);
		}
		
		function checkUnread(alldat) {
			// var unread = false;
			
			// for (var i = 0; i < alldat.length; i++) {
			// 	if (alldat[i].unread) {
			// 		unread = true;
			// 	}
			// }
			
			if (!main.find(".unread").length) {
				if (config.onAllRead)
					config.onAllRead();
			} else {
				if (config.onUnread)
					config.onUnread();
			}
		}

		function genMsg(sender /* uuid */, text, msgdat, alldat) {
			var msg = $(" \
				<div class='msg'> \
					<div class='sender-avatar'> \
						<div class='ui loader active'></div> \
						<div class='reddot'></div> \
					</div> \
					<div class='brief-info'> \
						<div class='sender-name'></div> \
						<div class='msg-cont'></div> \
					</div> \
					<div class='ellip'><i class='fitted ellipsis horizontal icon'></i></div> \
				</div> \
			");
			
			if (msgdat.sender == sender && msgdat.unread) {
				msg.addClass("unread");
			}
			
			util.userInfo(sender, null, null, function (suc, dat) {
				msg.find(".loader").removeClass("active");

				if (suc) {
					dat = login.parseInfo(dat);
				} else {
					dat = login.parseInfo({});
				}

				util.bgimg(msg.find(".sender-avatar"), dat.avatar);
				msg.find(".sender-name").html(dat.dname);
				msg.find(".msg-cont").html(text);

				msg.click(function () {
					if (msgdat.unread) {
						login.session(function (session) {
							if (session) foci.encop(session, {
								int: "pm",
								action: "setread",
								sender: msgdat.sender
							}, function (suc, dat) {
								if (suc) {
									msgdat.unread = false;
									msg.removeClass("unread");
									checkUnread(alldat);
								} else {
									util.emsg(dat);
								}
							});
						});
					}
					
					chatbox(sender, { use_dragi: config.use_dragi });
				});
			});

			return msg;
		}

		function getFirstMsg(dat) {
			var ret = [];

			for (var k in dat) {
				if (dat.hasOwnProperty(k) && dat[k].length) {
					ret.push(dat[k][0]);
				}
			}

			return ret;
		}

		function init() {
			has_view_all = false;
			$(this).html("view all");
		}

		main.find(".view-all-btn").click(function () {
			if (!has_view_all) {
				has_view_all = true;
				$(this).html("refresh");
			}

			ret.refresh();
		});

		main.find(".write-btn").click(function () {
			login.session(function (session) {
				uh.modal([], function (uuid) {
					if (uuid.length)
						chatbox(uuid[0], { use_dragi: config.use_dragi });
				}, {
					just_one: true,
					prompt: "User to chat",
					exclude: [ session.getUUID() ],
				 	use_dragi: config.use_dragi
				});
			});
		});

		holdon.reg("pmupdate", {
			proc: function (has) {
				if (has)
					config.onUnread(true);
			}
		});

		var ret = {};
		var has_view_all = false;

		var refresh_lock = false;
		var main_loader = main.find(".main-loader");

		ret.refresh = function (cb) {
			if (refresh_lock) return;
			refresh_lock = true;

			main.find(".msg-box-cont").html("");

			main_loader.addClass("active");

			login.session(function (session) {
				if (!session) {
					refresh_lock = false;
					main_loader.removeClass("active");
					return;
				}

				foci.encop(session, {
					int: "pm",
					action: has_view_all ? "gethead" : "update"
				}, function (suc, dat) {
					main_loader.removeClass("active");

					if (suc) {
						// console.log(dat);
						if (dat.length) {
							// console.log(parseConv(session.getUUID(), dat));
							if (!has_view_all) {
								dat = getFirstMsg(parseConv(session.getUUID(), dat));
							}

							main.find(".msg-box").removeClass("empty");
							var self_uuid = session.getUUID();

							dat.sort(function (a, b) {
								return new Date(b.date) - new Date(a.date);
							});

							for (var i = 0; i < dat.length; i++) {
								main.find(".msg-box-cont").append(genMsg(
									dat[i].sender == self_uuid ? dat[i].sendee : dat[i].sender,
									dat[i].msg, dat[i], dat
								));
							}
							
							checkUnread(dat);
						} else {
							main.find(".msg-box").addClass("empty");
							setPrompt(has_view_all ? "no conversation" : "no update");
						}
					} else {
						util.emsg(dat);
					}

					if (cb) cb(suc && dat.length);

					refresh_lock = false;
				});
			});
		};

		ret.init = function (cb) {
			init();
			ret.refresh(cb);
		};

		return ret;
	}

	return {
		chatbox: chatbox,
		qview: qview
	};
});
