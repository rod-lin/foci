/* map */

"use strict";

define([ "com/util" ], function (util) {
	var $ = jQuery;
	foci.loadCSS("com/map.css");
	$("head").append("<script type='text/javascript' src='http://api.map.baidu.com/getscript?v=2.0&ak=B4lBjPwv47t4CNlFiyY4siyy'>");

	var geoc = null;

	function waitBMap(cb) {
		var proc = setInterval(function () {
			if (!window.BMap) return;
			clearInterval(proc);
			cb();
		}, 10);
	}

	function locToName(lng, lat, cb) {
		waitBMap(function () {
			if (!geoc) geoc = new BMap.Geocoder();

			geoc.getLocation(new BMap.Point(lng, lat), function(rs) {
				cb(rs.address || "未知");
			});
		});
	}

	function initMap(cont, init, cb) {
		cont = $(cont);

		var main = $("<div style='height: 100%;'></div>")
		var loader = $("<div class='ui active loader'></div>");

		cont.append(main);
		cont.append(loader);

		waitBMap(function () {
			loader.removeClass("active");

			var map = new BMap.Map(main[0]);

			map.centerAndZoom("杭州");
			map.enableScrollWheelZoom(true);
			map.setMapStyle({ style: "grayscale" });

			var cur_marker = null;
			var cur_loc = null;

			map.addEventListener("click", function(e) {
				if (cur_marker) map.removeOverlay(cur_marker);

				var marker = new BMap.Marker(e.point);
				map.addOverlay(marker);

				cur_marker = marker;
				cur_loc = e.point;

				locToName(e.point.lng, e.point.lat, function(addr) {
					cb(e.point.lng, e.point.lat, addr);
				});
			});

			if (init) init({
				cur: function () {
					return cur_loc;
				},

				init: function () {
					map.centerAndZoom("杭州");
				},

				set: function (lng, lat) {
					if (cur_marker) map.removeOverlay(cur_marker);

					var p = new BMap.Point(lng, lat);
					cur_marker = new BMap.Marker(p);
					cur_loc = p;

					map.centerAndZoom(p, 12);
					map.addOverlay(cur_marker);

					locToName(lng, lat, function(addr) {
						cb(lng, lat, addr);
					});
				},

				clear: function () {
					if (cur_marker) map.removeOverlay(cur_marker);
					cur_marker = null;
					cur_loc = null;
				}
			});
		});
	}

	function embed(cont, init, cb) {
		initMap(cont, init, cb);
	}

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
			if (!bmap.cur()) {
				msg.removeClass("blue").addClass("red");
				msg.html("Please choose a location first");
				return;
			}

			main.modal("hide");
		});

		var bmap = null;

		waitBMap(function () {
			main.modal("show");
			main.find(".dimmer").removeClass("active");

			initMap(".map", function (map) { bmap = map; }, function (lng, lat, addr) {
				msg.removeClass("red").addClass("blue");
				msg.html(addr);
			});
		});

		main.modal({
			allowMultiple: true,
			observeChanges: true,
			autofocus: false,

			closable: true,

			onHide: function () {
				if (!bmap) return false;

				if (!bmap.cur()) {
					msg.removeClass("blue").addClass("red");
					msg.html("Please choose a location first");
					return false;
				}

				var geoc = new BMap.Geocoder();

				var p = bmap.cur();
				geoc.getLocation(p, function(rs) {
					if (cb) cb(p.lng, p.lat, rs.address);
				});

				return true;
			}
		});

		main.modal("show");
	}

	return {
		init: init,
		locToName: locToName,
		embed: embed
	};
});
