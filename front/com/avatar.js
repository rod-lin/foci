/* avatar */

"use strict";

define([ "com/xfilt", "com/util", "com/login" ], function (xfilt, util, login) {
	var $ = jQuery;
	foci.loadCSS("com/avatar.css");

	function init(cont, info, config) {
		cont = $(cont);
		config = $.extend({
			size: "3rem",
			radius: "50%",
			popdir: "top center",
			shadow: "0 0 2px rgba(0, 0, 0, 0.4)"
		}, config);

		info = login.parseInfo(info || {});

		var ava = $(" \
			<div class='com-avatar'> \
				<div class='avatar' style='background-image: url(\"" + info.avatar + "\"); height: " + config.size + "; width: " + config.size + ";'></div> \
			</div> \
		");

		ava.find(".avatar")
			.css({
				"border-radius": config.radius,
				"box-shadow": config.shadow
			});

		var avacont = $("<div class='dname'>" + xfilt(info.dname ? info.dname : "anonymous") + "</div>");

		ava.popup({
			html: avacont,
			position: config.popdir,
			hoverable: true
		});

		ava.click(function () {
			if (info.uuid) {
				if (config.onClick) config.onClick();
				util.jump("#profile/" + info.uuid);
			}
		});

		cont.append(ava);

		var ret = { dom: ava };

		ret.setAvatar = function (file) {
			util.bgimg(ava.find(".avatar"), file);
		};

		return ret;
	}

	return {
		init: init
	};
});
