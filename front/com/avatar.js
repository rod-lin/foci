/* avatar */

"use strict";

define([ "com/xfilt" ], function (xfilt) {
	var $ = jQuery;
	foci.loadCSS("com/avatar.css");

	function choose(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function init(cont, info, config) {
		cont = $(cont);
		config = $.extend({
			size: "1.5em"
		}, config);

		info = info || {};

		var url = info.avatar ? foci.download(info.avatar) : choose([ "img/deficon.jpg", "img/matt.jpg", "img/stevie.jpg", "img/elliot.jpg" ]);

		var ava = $(" \
			<div class='com-avatar'> \
				<div class='avatar' style='background-image: url(\"" + url + "\"); height: " + config.size + "; width: " + config.size + ";'></div> \
				<div class='ui popup transition hidden'> \
					<div class='dname'>" + xfilt(info.dname ? info.dname : "anonymous") + "</div> \
				</div> \
			</div> \
		");

		ava.popup({
			popup: ava.find(".popup"),
			position: "top center",
			hoverable: true
		});

		cont.append(ava);

		return {};
	}

	return {
		init: init
	};
});
