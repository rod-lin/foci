/* user bar */

/* require jQuery, semantic */

if (!window.fcom) window.fcom = {};
fcom.ubar = {};

(function () {
	fcom.ubar.init = function () {
		var main = ' \
			<div class="com-ubar"> \
				<div class="ui popup transition hidden"> \
					<div class="title">Rodlin</div> \
					<div class="ui star mini rating top center" data-rating="4" data-max-rating="5"></div> \
				</div> \
				<div class="avatar" style="background-image: url(\'img/deficon.jpg\');"></div> \
			</div> \
		';

		$("body").append(main);

		$(".com-ubar").find(".rating").rating("disable");

		$(".com-ubar .avatar")
			.popup({
				popup: $(".com-ubar").find(".popup"),
				position: "top right",
				hoverable: true
			});
	};
})();
