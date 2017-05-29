/* avatar */

"use strict";

define([ "com/xfilt", "com/util" ], function (xfilt, util) {
	var $ = jQuery;
	foci.loadCSS("com/avatar.css");

	function init(cont, info, config) {
		cont = $(cont);
		config = $.extend({
			size: "1.5em",
			popdir: "top center"
		}, config);

		info = info || {};

		var url = info.avatar ? foci.download(info.avatar) : [ "img/deficon.jpg", "img/matt.jpg", "img/stevie.jpg", "img/elliot.jpg" ].choose();

		var ava = $(" \
			<div class='com-avatar'> \
				<div class='avatar' style='background-image: url(\"" + url + "\"); height: " + config.size + "; width: " + config.size + ";'></div> \
				<div class='ui popup transition hidden' style='z-index: 3;'> \
					<div class='dname'>" + xfilt(info.dname ? info.dname : "anonymous") + "</div> \
				</div> \
			</div> \
		");

		ava.popup({
			popup: ava.find(".popup"),
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

		return {};
	}

	return {
		init: init
	};
});
