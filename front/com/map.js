/* map */

"use strict";

define([ "com/util" ], function (util) {
	var $ = jQuery;
	foci.loadCSS("com/map.css");
	$("head").append("<script type='text/javascript' src='http://api.map.baidu.com/getscript?v=2.0&ak=B4lBjPwv47t4CNlFiyY4siyy'>");

	function init(config, cb) {
		config = $.extend({
			prompt: "Click and choose a location"
		}, config);

		var main = $(" \
			<div class='com-map ui small modal'> \
				<div class='board'> \
					<div class='ui active dimmer'> \
						<div class='ui large loader'></div> \
					</div> \
					<div class='ui blue message'></div> \
					<div class='map'></div> \
				</div> \
			</div> \
		");

		var msg = main.find(".message");

		msg.html(config.prompt);

		msg.click(function () {
			if (!cur_loc) {
				msg.removeClass("blue").addClass("red");
				msg.html("Please choose a location first");
				return;
			}

			main.modal("hide");
		});

		var cur_marker = null;
		var cur_loc = null;

		var wait = setInterval(function () {
			if (!window.BMap) return;

			main.modal("show");

			clearInterval(wait);
			main.find(".dimmer").removeClass("active");

			var map = new BMap.Map(main.find(".map")[0]);

			map.centerAndZoom("杭州", 11);
			map.setCurrentCity("杭州");
			map.enableScrollWheelZoom(true);
			map.setMapStyle({ style: "grayscale" });

			var geoc = new BMap.Geocoder();

			map.addEventListener("click", function(e) {
				msg.removeClass("red").addClass("blue");

				if (cur_marker) map.removeOverlay(cur_marker);

				var marker = new BMap.Marker(e.point);
				map.addOverlay(marker);

				cur_marker = marker;
				cur_loc = e.point;

				geoc.getLocation(e.point, function(rs) {
					msg.html(rs.address);
				});
			});
		}, 10);

		main.modal({
			allowMultiple: true,
			observeChanges: true,
			autofocus: false,

			closable: true,

			onHide: function () {
				if (!cur_loc) {
					msg.removeClass("blue").addClass("red");
					msg.html("Please choose a location first");
					return false;
				}

				var geoc = new BMap.Geocoder();

				geoc.getLocation(cur_loc, function(rs) {
					cb(cur_loc.lng, cur_loc.lat, rs.address);
				});

				return true;
			}
		});

		main.modal("show");
	}

	return {
		init: init
	};
});
