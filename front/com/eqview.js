/* event quick view */

"use strict";

define([ "com/avatar" ], function (avatar) {
	var $ = jQuery;
	foci.loadCSS("com/eqview.css");

	function init(info) {
		var main = $(" \
			<div class='com-eqview ui large modal'> \
				<div class='cover' style='background-image: url(\"img/tmp2.jpg\");'></div> \
				<div class='logo-cont'> \
					<div class='logo' style='background-image: url(\"img/deficon.jpg\");'></div> \
					<div class='title'>Student Party</div> \
					<div class='detail'><i class='map outline icon'></i>Hangzhou Foreign Language School</div> \
					<div class='detail'><i class='calendar outline icon'></i>12:00 - 23:00</div> \
				</div> \
				<div class='cont'> \
					<div class='descr'> \
						We are gonna have this party at HFLS in Wednesday. \
						We are gonna have this party at HFLS in Wednesday. \
						We are gonna have this party at HFLS in Wednesday. \
					</div> \
					<div class='ui horizontal divider'>Organizer</div> \
					<div class='orgs'> \
					</div> \
				</div> \
				<div class='more'>MORE</div> \
			</div> \
		");

		var ava;

		for (var i = 0; i < 1; i++) {
			ava = $("<div class='org'></div>");
			avatar.init(ava, null, { size: "2em" });
			main.find(".orgs").prepend(ava);
		}

		main.ready(function () {
			main.modal("show");

			main.ready(function () {
				vcent.update();
				main.modal("refresh");
			});
		});
	}

	return {
		init: init
	}
});
