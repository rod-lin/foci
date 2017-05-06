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

	util.qmsg = function (str) {
		alert("debug error: " + str);
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
					' + msg + ' \
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

	Array.prototype.choose = function () {
		return this[Math.floor(Math.random() * this.length)];
	};

	return util;
});
