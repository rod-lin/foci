/* util */

"use strict";

define(function () {
	var util = {};
	foci.loadCSS("com/util.css");

	util.short = function (str, max, fill) {
		fill = fill || "...";

		if (str.length > max) {
			return str.substr(0, max - fill.length) + fill;
		}

		return str;
	};

	util.mfilt = function (str) {
		return str;
	};

	util.jump = function (url) {
		window.location = url;
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

		var hide = function () {
			msg.transition("scale");
			clearTimeout(proc);

			setTimeout(function () {
				msg.remove();
			}, 5000);
		};

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
			.transition("scale")
			.html(util.mfilt(str))
			.click(hide);

		var proc = setTimeout(hide, 5000);
		
		$("body").append(msg);
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
		$(window).on("resize", function () {
			if ($(window).width() <= max_width)
				cb();
			else
				exit();
		});
	};

	util.ask = function (msg, cb) {
		var main = $(' \
			<div class="ui small modal com-util-ask"> \
				<div class="ui header"> \
					' + util.mfilt(msg) + ' \
				</div> \
				<div class="actions"> \
					<div class="ui red cancel button"> \
						<i class="remove icon"></i> \
						No \
					</div> \
					<div class="ui green ok button"> \
						<i class="checkmark icon"></i> \
						Yes \
					</div> \
				</div> \
			</div> \
		');

		var ret = true;

		main.modal({
			closable: false,
			allowMultiple: true,

			onDeny: function(){
				ret = false;
			},

			onApprove: function() {
				ret = true;
			},

			onHidden: function () {
				cb(ret);
			}
		}).modal("show");
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

	// cb(n) if scroll down
	// cb(-n) if scroll up
	util.scroll = function (elem, cb) {
		elem = $(elem);

		var cur = elem.scrollTop();
		var acc = 0;

		var onscr = function () {
			var now = $(this).scrollTop();

			if (Math.abs(now - cur) > 20) {
				cb(now - cur);
			}

			cur = now;

			// elem.off("scroll", onscr);
			// setTimeout(function () {
			// 	elem.on("scroll", onscr);
			// }, 100);
		};

		elem.on("scroll", onscr);
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
		util.img(url, function (img) {
			$(obj).css("background-image", "url('" + url + "')").ready(function () {
				if (load) load(img);
			});
		});
	};

	return util;
});
