/* util */

"use strict";

define([ "com/xfilt", "com/dragi.js" ], function (xfilt, dragi) {
	var util = {};
	foci.loadCSS("com/util.css");

	util.short = function (str, max, fill) {
		fill = fill || "...";

		if (max > 0 && str.length > max) {
			return str.substr(0, max - fill.length) + fill;
		}

		return str;
	};

	util.mfilt = function (str) {
		return str;
	};
	
	util.isMobile = function () {
		return $(window).width() <= 640;
	};

	util.jump = function (url, allow_dragi, forced) {
		if (allow_dragi && foci.use_dragi) {
			dragi.iframe(foci.platform, url);
		} else {
			if (window.location.hash === url) {
				if (forced) {
					util.refresh();
				} else
					util.emsg("already here", "info");
			} else window.location = url;
		}
	};
	
	util.sjump = function (url) {
		window.location = url;
	};

	util.refresh = function () {
		require("com/env").get("part").refresh();
	};

	util.emsg = function (str, style) {
		style = style || "error";
		var msg = $(" \
			<div style='text-align: center;'> \
				<div> \
					<div class='ui " + style + " message' style='word-wrap: break-word;'></div> \
				</div> \
			</div> \
		");
		
		var hidden = false;

		var hide = function () {
			if (hidden) return;
			hidden = true;
			
			msg.transition("scale out");
			clearTimeout(proc);

			setTimeout(function () {
				msg.remove();
			}, 5000);
		};

		$("body").append(msg);

		msg.css({
			"position": "fixed",
			"top": "9px",
			"z-index": "1000000",
			"width": "100%",
			"pointer-events": "none"
		});

		msg.children("div")
			.css({
				"max-width": "80%",
				"display": "inline-block"
			})

		msg.find(".message")
			.css("cursor", "pointer")
			.css("pointer-events", "auto")
			.transition("scale in")
			.html(util.mfilt(str))
			.click(hide);

		var proc = setTimeout(hide, 5000);
		
		msg.mouseover(function () {
			if (proc && !hidden) {
				clearTimeout(proc);
				proc = null;
			}
		});
		
		msg.mouseleave(function () {
			if (!proc && !hidden)
				proc = setTimeout(hide, 2000);
		});
	};

	util.json = function (str) {
		var ret = null;

		if (!str) return null;

		try {
			ret = JSON.parse(str);
		} catch (e) {
			util.emsg("$def.illegal_json");
		}

		return ret;
	};

	util.listen = function (dob) {
		var proc = setInterval(function () {
			if (dob()) clearInterval(proc);
		}, 0);
	};

	// async times
	util.atimes = function (dob, time) {
		var i = 0;
		var proc = setInterval(function () {
			dob(); i++;
			if (i > time) clearInterval(proc);
		}, 0);
	};

	util.media = function (max_width, cb, exit) {
		$(window).resize(function () {
			if ($(window).width() <= max_width)
				cb();
			else
				exit();
		}).resize();
	};
	
	util.windowWidth = function () {
		return $(window).width();
	};

	util.ask = function (msg, cb) {
		var main = $("<div class='ui page dimmer active com-util-ask-modal'> \
			<div class='content'> \
				<div> \
					<div class='cont'> \
						<h1 class='ui header'><i class='warning circle fitted icon'></i></h1> \
						<div class='msg'></div> \
						<div class='opt-bar' style='margin-top: 2em;'> \
							<button class='ui red button rej-btn'>No</button> \
							<button class='ui green button acc-btn'>Yes</button> \
						</div> \
					</div> \
				</div> \
			</div> \
		</div>");

		// var activated = $(".ui.page.dimmer.transition.visible");

		main.find(".msg").html(msg);
		$("body").append(main);
		
		if (!util.isMobile()) {
			$("body").addClass("blurred");
		}

		main.transition("fade in");

		var closed = false;

		var res = function (ans) {
			return function () {
				if (closed) return;
				closed = true;
	
				main.transition("fade out");
				$("body").removeClass("blurred");
	
				if (cb) cb(ans);

				setTimeout(function () {
					main.remove();
				}, 3000);

				// setTimeout(function () {
				// 	activated.transition("fade in");
				// }, 300);
			};
		};

		main.find(".acc-btn").click(res(true));
		main.find(".rej-btn").click(res(false));

		main.find(".cont").click(function (e) {
			e.stopImmediatePropagation();
		});

		main.click(res(false));
	};

	// success or failed
	util.suc = function (suc, msg) {
		util.emsg((suc ? "success: " : "failed: ") + msg, "success");
	};

	util.kcount = function (obj) {
		var count = 0;

		for (var k in obj) {
			if (obj.hasOwnProperty(k)) count++;
		}

		return count;
	};

	util.fill = function () {
		return $("<img class='com-util-cont-fill' src='img/paragraph.png'></img>");
	};

	util.scrollBottom = function (elem, ofs, cb) {
		elem = $(elem);
		ofs = ofs || 0;

		var scroll = {
			toTop: function (ofs) { elem.scrollTop(ofs || 0); },
			toBottom: function (ofs) { elem.scrollTop(elem.prop("scrollHeight") - elem.height() - (ofs || 0)); }
		};

		elem.scroll(function () {
			if ((elem.scrollTop() + ofs) >= (elem.prop("scrollHeight") - elem.height())) {
				cb(scroll);
			}
		});
	};

	util.scrollTop = function (elem, cb, alt, offset) {
		var tool = {
			off: function () {
				$(elem).off("scroll", null, proc);
			}
		};
		
		var proc = function () {
			if ($(elem).scrollTop() < offset) {
				cb();
			} else {
				alt();
			}
		};
		
		$(elem).scroll(proc).scroll();
		
		return tool;
	};

	util.bottom = function (elem) {
		elem.scrollTop(elem.prop("scrollHeight") - elem.height());
	};

	// cb(n) if scroll down
	// cb(-n) if scroll up
	util.scroll = function (elem, cb, down_ofs, up_ofs,
							min_top /* min_top distance to trigger */) {
		elem = $(elem);

		var cur = elem.scrollTop();
		var acc = 0;
		
		min_top = (min_top === undefined ? 0 : min_top);
		down_ofs = (down_ofs === undefined ? 5 : down_ofs);
		up_ofs = (up_ofs === undefined ? 5 : up_ofs);
		
		var off = function () {
			elem.off("scroll", null, onscr);
		};

		var onscr = function () {
			var now = $(this).scrollTop();

			// scrolling down need to be faster to trigger
			// console.log(now);
			if ((now >= min_top && now > cur && now - cur > down_ofs) || // scroll down
				(cur > now && cur - now > up_ofs)) {
				cb(now - cur, cur);
			}

			cur = now;

			// elem.off("scroll", onscr);
			// setTimeout(function () {
			// 	elem.on("scroll", onscr);
			// }, 100);
		};

		elem.on("scroll", onscr);
		
		return off;
	};

	util.nextTick = function (cb) {
		setTimeout(cb, 0);
	};

	util.await = function (cond, cb) {
		var proc = setInterval(function () {
			if (cond()) {
				clearInterval(proc);
				cb();
			}
		}, 30);
	};

	Array.prototype.choose = function () {
		return this[Math.floor(Math.random() * this.length)];
	};

	Array.prototype.last = function () {
		return this[this.length - 1];
	};

	String.prototype.capital = function () {
		return this[0].toUpperCase() + this.substr(1);
	};

	util.random = function (a, b) {
		return (Math.random() * (b - a)) + a;
	};

	util.blur = function (obj, r) {
		obj = $(obj);
		r = r || 5;
		obj.css({
			"-webkit-filter": "blur(" + r + "px)",
			"-moz-filter": "blur(" + r + "px)",
			"-ms-filter": "blur(" + r + "px)",
			"filter": "blur(" + r + "px)"
		});
	};

	util.img = function (url, cb) {
		var img = new Image();
		img.src = url;
		$(img).on("load", function () {
			cb(img);
		});
	};

	util.bgimg = function (obj, url, load) {
		obj = $(obj);

		if (url) {
			obj.css("background-image", "url('" + url + "')");

			util.img(url, function (img) {
				obj.ready(function () {
					if (load) load(img);
				});
			});
		} else {
			obj.css("background-image", "");
			if (load) load();
		}
	};
	
	var fill0 = util.fill0 = function (str, bit, after) {
		str = str.toString();
		
		while (str.length < bit) {
			if (after) {
				str = str + "0";
			} else {
				str = "0" + str;
			}
		}
		
		return str;
	};

	util.localDate = function (date, short) {
		var cur = new Date();
		var sub = cur - date;

		var ud = 1000 * 60 * 60 * 24; // one day

		var time = fill0(date.getHours(), 2) + ":" + fill0(date.getMinutes(), 2);
		var ret;

		if (sub >= 0 && sub < ud) {
			ret = "Today " + time;
		} else {
			var day = cur.getDay();

			if (sub >= 0 && sub < day * ud) {
				// in this week
				var pref = [ "Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat" ][date.getDay()];
				ret = pref + " " + (short ? "" : time);
			} else {
				ret = (date.getMonth() + 1) + "-" + date.getDate() + " " + (short ? "" : time);

				if (cur.getFullYear() != date.getFullYear())
					ret = date.getFullYear() + "-" + ret;
			}
		}

		return ret;
	};

	// unreliable
	util.wheel = function (cb) {
		$(window).on("mousewheel DOMMouseScroll", cb);
	};

	util.randimg = function () {
		return "img/cover/" + Math.floor(Math.random() * 30 + 1) + ".jpg";
	};

	// mode: 0: after, 1, before, 2, replace
	util.insertTextarea = function (textarea, val, mode) {
		textarea = $(textarea)[0];
		mode = mode || "after";

		if (document.selection) {
			// ie
			textarea.focus();
			var sel = document.selection.createRange();
			sel.text = val;
		} else if (textarea.selectionStart || textarea.selectionStart == '0') {
			// others
			var start, end;

			switch (mode) {
				case "before":
					start = end = textarea.selectionStart;
					break;

				case "after":
					start = end = textarea.selectionEnd;
					break;

				case "replace":
					start = textarea.selectionStart;
					end = textarea.selectionEnd;
					break;
			}

			textarea.value = textarea.value.substring(0, start)
							 + val
							 + textarea.value.substring(end, textarea.value.length);

			textarea.focus();
		} else {
			textarea.value += val;
		}
	};
	
	util.getSelection = function (dom) {
		if (window.getSelection) {
			var sel = window.setSelection();
			
			
		}
		
		return {
			start: 0,
			end: 0,
			dir: "forward"
		};
	};
	
	util.setSelection = function (dom, sel) {
		
	};

	util.trimFloat = function (val, decimal) {
		var e = Math.pow(10, decimal);
		return Math.floor(val * e) / e;
	};

	// run once according to the local record
	util.localOnce = function (id, func) {
		id = "util-local-once-" + id;

		if (foci.getLocal(id)) return;

		foci.setLocal(id, true);
		func();
	};

	util.setTitle = function () {
		document.title = "Foci - " + Array.prototype.slice.apply(arguments).join(" - ");
	};
	
	util.ratingOf = function (uuid, cb) {
		foci.get("/user/rating", {
			uuid: uuid
		}, function (suc, dat) {
			if (suc) {
				cb(dat);
			} else {
				util.emsg(dat);
				cb(0);
			}
		});
	};
	
	// this function does not parse the html source
	// bu t directly convert html to plain text(escaped)
	util.htmlToText = function (html) {
		return $("<span>" + xfilt(html) + "</span>").text();
	};

	// htmlGist convert html to text without executing the content in it
	util.htmlGist = function (html) {
		return xfilt(html.replace(/<img[^>]*(\/?>|><\/img>)/g, "[Image] ")
						 .replace(/<br>|<br\/>|<br><\/br>/g, "\n")
						 .replace(/<[^>]*>/g, "")
						 .replace(/(\s|&nbsp;)+/g, " "));
	};
	
	util.createObjectURL = function (blob) {
		var url = window[window.webkitURL ? "webkitURL" : "URL"];
		
		if (url && url.createObjectURL) return url.createObjectURL(blob);
	
		return undefined;
	};

	util.checkUploadSize = function (input, cb) {
		input = $(input)[0];
		
		if (input.files && input.files[0]) {
			if (foci.config && foci.config.max_upload_size) {
				if (input.files[0].size > foci.config.max_upload_size) {
					util.emsg("max upload size exceeded");
					cb(false);
					return;
				}
			}
		}
		
		cb(true);
	};

	var cached_info = {
		"user": {
			api: "/user/info",
			arg: function (uid) {
				return { uuid: uid };
			},
			
			cache: {}
		},
		
		"event": {
			api: "/event/info",
			arg: function (uid) {
				return { euid: uid }
			},
			
			cache: {}
		}
	};
	
	util.clearCachedInfo = function (type, uid) {
		delete cached_info[type][uid];
	};

	util.cachedInfo = function (type, uid, cb, fail, com) {
		var table = cached_info[type];
		var entry = table.cache[uid];
		var now = new Date();
		
		if (entry && now - entry.ctime < 60000) {
			// exists and still valid
			if (cb) cb(entry.dat);
			if (com) com(true, entry.dat);
			return;
		}
		
		// TODO: pending & callback
		
		var primary = false;
		
		var next = function (suc, dat) {
			if (suc) {
				table.cache[uid] = {
					ctime: new Date(),
					dat: dat
				};
				
				if (cb) cb(dat);
			} else {
				util.emsg(dat);
				if (fail) fail();
			}
			
			if (com) com(suc, dat);
			
			if (primary && entry) {
				for (var i = 0; i < entry.cb.length; i++) {
					entry.cb[i](suc, dat);
				}
			}
		};
		
		if (entry && entry.pending) {
			// pushed to callback list
			entry.cb.push(next);
			return;
		}
		
		primary = true;
		
		entry = table.cache[uid] = {
			pending: true,
			cb: []
		};
		
		foci.get(table.api, table.arg(uid), next);
	};
	
	util.userInfo = function (uuid, cb, fail, com) {
		return util.cachedInfo("user", uuid, cb, fail, com);
	};
	
	util.eventInfo = function (euid, cb, fail, com) {
		return util.cachedInfo("event", euid, cb, fail, com);
	};
	
	util.invalidUserInfo = function (uuid) {
		util.clearCachedInfo("user", uuid);
		
		// clear cache
		require([ "com/env" ], function (env) {
			if (env.session() && env.session().getUUID() == uuid) {
				env.clearUserCache();
			}
		});
	};
	
	util.invalidEventInfo = function (euid) {
		util.clearCachedInfo("event", euid);
	};

	util.waitFor = function (obj, cb) {
		var proc = setInterval(function () {
			if (obj()) {
				cb();
			}

			clearInterval(proc);
		}, 1000);
	};

	util.imgsize = function (src, cb) {
		util.img(src, function (img) {
			cb({
				width: img.width,
				height: img.height
			});
		});
	};

	util.isLocalStorageEnabled = function () {
		var enabled = false;

		try {
			localStorage["test"] = "1";
		} catch (e) {
			enabled = false;
		}

		return enabled;
	};

	util.nothumb = function (src) {
		if (/^\/file\/derefer|^\/file\/download/.test(src)) {
            if (/thumb=\d+/.test(src)) {
                src = src.replace(/thumb=\d+/g, "thumb=0");
            } else {
                src = src += "&thumb=0";
            }
		}
		
		return src;
	};

	util.shuffle = function (arr) {
		var tmp = new Array(arr.length);

		for (var i = 0; i < arr.length; i++) {
			tmp[i] = [ Math.random(), arr[i] ];
		}

		tmp.sort(function (a, b) {
			return a[0] - b[0];
		});

		var ret = new Array(arr.length);

		for (var i = 0; i < arr.length; i++) {
			ret[i] = tmp[i][1];
		}

		return ret;
	};

	return util;
});
