/* personal message */

define([ "com/util", "com/login", "com/xfilt", "com/lang", "com/userhunt" ], function (util, login, xfilt, lang, uh) {
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
						<div class='history'></div> \
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

			foci.get("/user/info", { uuid: sendee }, function (suc, dat) {
				if (suc) {
					sendee_info = dat = login.parseInfo(dat);
					util.bgimg(main.find(".header .sendee-avatar"), dat.avatar);
					main.find(".header .sendee-name").html(dat.dname);
					main.find(".header .sendee-intro").html(dat.intro);
					if (cb) cb(dat);
				} else {
					util.emsg(dat);
					if (cb) cb(login.parseInfo({}));
				}
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

				foci.encop(session, {
					int: "pm",
					action: "getconv",
					sender: sendee
				}, function (suc, dat) {
					main.find(".msg-box>.loader").removeClass("active").addClass("hidden");
					if (suc) {
						var self_uuid = session.getUUID();

						for (var i = 0; i < dat.length; i++) {
							dat[i].date = new Date(dat[i].date);

							if (needDate(i ? dat[i - 1] : null, dat[i])) {
								main.find(".history").append(formatDate(dat[i].date));
							}

							main.find(".history").append(genMsg(
								(dat[i].sender == self_uuid ? null : dat[i].sender),
								dat[i].msg
							));
						}

						all_msg = dat.concat(all_msg);

						setTimeout(function () {
							main.find(".msg-box").scrollTop(main.find(".history").height());
						}, 300);
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

		function checkUpdate() {
			login.session(function (session) {
				if (!session) return;

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
								main.find(".msg-box").append(genMsg(dat[0].sender, dat[i].msg));
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
						update_proc = setTimeout(checkUpdate, 1000);
				});
			});
		}

		loadHistory(function () {
			util.bottom(main.find(".msg-box"));
		});

		checkUpdate();

		function hide() {
			if (config.use_dragi) {
				main.dragi("close");
			} else {
				main.modal("hide");
			}
		}

		if (config.use_dragi) {
			main.removeClass("ui small modal")
				.dragi({
					height: "auto",
					onClose: function () {
						clearTimeout(update_proc);
						exit = true;
					},
					
					title: "Chat"
				})
		} else {
			main.modal({
				onHide: function () {
					clearTimeout(update_proc);
					exit = true;
				}
			});
			
			main.modal("show");
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
		}, config)

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

		function genMsg(sender /* uuid */, text) {
			var msg = $(" \
				<div class='msg'> \
					<div class='sender-avatar'><div class='ui loader active'></div></div> \
					<div class='brief-info'> \
						<div class='sender-name'></div> \
						<div class='msg-cont'></div> \
					</div> \
					<div class='ellip'><i class='fitted ellipsis horizontal icon'></i></div> \
				</div> \
			");

			foci.get("/user/info", { uuid: sender }, function (suc, dat) {
				msg.find(".loader").removeClass("active");

				if (suc) {
					dat = login.parseInfo(dat);
				} else {
					util.emsg(dat);
					dat = login.parseInfo({});
				}

				util.bgimg(msg.find(".sender-avatar"), dat.avatar);
				msg.find(".sender-name").html(dat.dname);
				msg.find(".msg-cont").html(text);

				msg.click(function () {
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

		var ret = {};
		var has_view_all = false;

		ret.refresh = function (cb) {
			main.find(".msg-box-cont").html("");

			login.session(function (session) {
				if (!session) return;

				foci.encop(session, {
					int: "pm",
					action: has_view_all ? "gethead" : "update"
				}, function (suc, dat) {
					main.find(".main-loader").removeClass("active");

					if (suc) {
						// console.log(dat);
						if (dat.length) {
							// console.log(parseConv(session.getUUID(), dat));
							if (!has_view_all) {
								dat = getFirstMsg(parseConv(session.getUUID(), dat));
							}

							main.find(".msg-box").removeClass("empty");
							var self_uuid = session.getUUID();

							for (var i = 0; i < dat.length; i++) {
								main.find(".msg-box-cont").append(genMsg(
									dat[i].sender == self_uuid ? dat[i].sendee : dat[i].sender,
									dat[i].msg
								));
							}
						} else {
							main.find(".msg-box").addClass("empty");
							setPrompt(has_view_all ? "no conversation" : "no update");
						}
					} else {
						util.emsg(dat);
					}

					if (cb) cb(suc && dat.length);
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
