/* map */

"use strict";

define([ "com/util" ], function (util) {
	var $ = jQuery;
	foci.loadCSS("com/map.css");

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

	function pointToStd(point, cb) {
		var lng = point.lng;
		var lat = point.lat;

		locToName(lng, lat, function(addr) {
			cb(lng, lat, addr);
		});
	}

	function prevPorp(bmap, obj) {
		obj = $(obj);

		var down = function (ev) {
			bmap.freezeMark();
		};

		var up = function (ev) {
			util.nextTick(function () {
				bmap.unfreezeMark();
			});
		};

		// obj.mousedown(down).on("touchstart", down);
		// obj.mouseup(up).on("touchend", up);
	}

	function createOverlay(bmap, marker, option, config) {
		config = $.extend({}, config);

		function cons(point) {
			this.point = point;
			var obj = this.obj = marker.clone();

			obj.css("transition", "opacity 0.2s");

			var popup = $("<div class='ui popup hidden' style='padding: 0;'></div>");
			$("body").append(popup);

			if (option)
				for (var i = 0; i < option.length; i++) {
					var opt = $("<div class='com-map-option'>" + option[i].name + "</div>");
					popup.append(opt);

					if (option[i].onClick) {
						opt.click((function (cb) {
							return function () {
								pointToStd(point, cb);
							};
						})(option[i].onClick));
					}
				}

			prevPorp(bmap, popup);

			obj.popup({
				popup: popup,
				on: "click",
				variation: "inverted",
				position: "top center",

				lastRetort: true,
				exclusive: true
			});
		}

		cons.prototype = new BMap.Overlay();

		cons.prototype.popup = function (command) {
			this.obj.popup(command);
		};

		cons.prototype.initialize = function (map) {
			this.map = map;
			var obj = this.obj;
			var that = this;

			// var zindex = BMap.Overlay.getZIndex(this.point.lat);
			// obj.css("z-index", "9999");

			function repos() {
				if (obj.popup("is visible"))
					obj.popup("reposition");

				obj.css("opacity", 1);
				that.draw();
			}

			function hide() {
				obj.popup("hide");
				obj.css("opacity", 0);
			}

			map.addEventListener("movestart", hide);

			map.addEventListener("moving", repos);
			map.addEventListener("moveend", repos);

			map.addEventListener("zoomstart", hide);

			map.addEventListener("zoomend", function () {
				obj.css("opacity", 1);
			});

			prevPorp(bmap, obj);

			bmap.dom.append(obj);
			// map.getPanes().floatPane.appendChild(obj[0]);
		
			return obj[0];
		};

		cons.prototype.draw = function () {
			var pixel = this.map.pointToPixel(this.point);
			this.obj.css("left", pixel.x - this.obj.outerWidth() / 2 + "px");
			this.obj.css("top", pixel.y - this.obj.outerHeight() / 2 + "px");
		};

		return cons;
	}

	var SelectMarker = function (bmap, point, select) {
		var selector = $("<div class='com-map-circle-marker red small'></div>");
		var obj = new (createOverlay(bmap, selector, [
			{
				name: "select",
				onClick: function (lng, lat, addr) {
					if (select) select(lng, lat, addr);
					obj.popup("hide");
				}
			}
		]))(point);
		
		return obj;
	};

	function initMap(cont, init, config) {
		config = $.extend({
			canMark: true,

			// onClick
			// onSelect
		}, config);
		cont = $(cont);

		var main = $("<div style='position: relative; height: 100%;'></div>")
		var loader = $("<div class='ui active loader'></div>");

		cont.append(main);
		cont.append(loader);

		console.log(config);

		var cur_marker = null;
		var cur_loc = null;

		waitBMap(function () {
			loader.remove();

			var map = new BMap.Map(main[0]);

			map.clearOverlays();

			var ret = {
				dom: main,
				raw: map,

				cur: function () {
					return cur_loc;
				},

				init: function () {
					map.centerAndZoom("杭州", 12);
				},

				mark: function (lng, lat, nopopup) {
					if (cur_marker) {
						cur_marker.popup("hide");
						map.removeOverlay(cur_marker);
					}

					var p = new BMap.Point(lng, lat);
					cur_marker = new SelectMarker(ret, p, config.onSelect);

					cur_loc = p;

					map.addOverlay(cur_marker);

					if (!nopopup)
						cur_marker.popup("show");

					locToName(lng, lat, function(addr) {
						if (config.onClick) config.onClick(lng, lat, addr);
					});
				},

				freezeMark: function () {
					config.canMark = false;
				},

				unfreezeMark: function () {
					config.canMark = true;
				},

				set: function (lng, lat) {
					map.setCenter(new BMap.Point(lng, lat));
					ret.mark(lng, lat, true);
				},

				clear: function () {
					map.reset();
					if (cur_marker) map.removeOverlay(cur_marker);
					cur_marker = null;
					cur_loc = null;
				}
			};

			map.centerAndZoom("杭州", 12);
			
			map.enableScrollWheelZoom(true);
			map.setMapStyle({ style: "grayscale" });

			map.addEventListener("click", function(e) {
				if (!config.canMark) return;
				ret.mark(e.point.lng, e.point.lat);
			});

			map.addEventListener("load", function () {
				if (init) init(ret);
				
				if (config.init_lng && config.init_lat) {
					ret.set(config.init_lng, config.init_lat);
				}
			});
		});
	}

	function embed(cont, init, config) {
		initMap(cont, init, config);
	}

	function search(onSelect, config) {
		config = $.extend({}, config);

		var main = $(" \
			<div class='com-map com-map-search ui small modal'> \
				<div class='board'> \
					<div class='ui icon input search' style='width: 100%;'> \
						<input class='prompt' type='text' placeholder='Type a location'> \
						<i class='search icon link' style='cursor: pointer;'></i> \
					</div> \
					<div class='map'></div> \
				</div> \
			</div> \
		");

		var bmap = null;

		var onSelectWrap = function (lng, lat, addr) {
			if (onSelect) onSelect(lng, lat, addr);
			main.modal("hide");
		};

		function search() {
			main.find(".search.input .prompt").blur();

			if (!bmap) {
				util.emsg("still initializing...", "info");
				return;
			}

			var kw = main.find(".search.input .prompt").val();

			main.find(".search.input").addClass("loading");

			var map = bmap.raw;

			var search_mark = $("<div class='com-map-circle-marker blue'></div>");
			var searchMaker = createOverlay(bmap, search_mark, [
				{
					name: "select",
					onClick: onSelectWrap
				}
			]);

			var local = new BMap.LocalSearch(bmap.raw, {
				// renderOptions: { map: bmap.raw },
				onSearchComplete: function (res) {
					main.find(".search.input").removeClass("loading");

					var from = "A".charCodeAt(0);

					if (local.getStatus() == BMAP_STATUS_SUCCESS) {
						for (var i = 0; i < res.getCurrentNumPois(); i++) {
							(function () {
								var poi = res.getPoi(i);
								var marker = new searchMaker(poi.point); // new BMap.Marker(poi.point);
								var popup = new BMap.InfoWindow("hello");

								marker.obj.html(String.fromCharCode(from + i));

								marker.addEventListener("click", function () {
									this.openInfoWindow(popup);
								});

								map.addOverlay(marker);
							})();
						}

						if (i) {
							// set the first point as center
							map.setCenter(res.getPoi(0).point);
						}
					}

					if (!res.getCurrentNumPois()) {
						util.emsg("no location found", "info");
					}
				}
			});

			local.search(kw);
		}

		main.find(".search.input").keydown(function (ev) {
			if (ev.which == 13) {
				search();
			}
		});

		main.find(".search.link").click(search);

		waitBMap(function () {
			main.modal("show");
			main.find(".dimmer").removeClass("active");

			initMap(main.find(".map"), function (map) {
				bmap = map;

				bmap.raw.addEventListener("click", function () {
					main.find(".search.input .prompt").blur();
				});
			}, {
				init_lng: config.init_lng,
				init_lat: config.init_lat,
				// canMark: false,

				onSelect: onSelectWrap
			});
		});

		main.modal("show");

		var ret = {};

		return ret;
	}

	function init(config, cb) {
		config = $.extend({
			view: false, /* view a map, not choose location */
			init_lng: null,
			init_lat: null,
			prompt: "Click and choose a location"
		}, config);

		var main = $(" \
			<div class='com-map ui small modal'> \
				<div class='board'> \
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

			initMap(main.find(".map"), function (map) { bmap = map; }, {
				init_lng: config.init_lng,
				init_lat: config.init_lat,
				canMark: !config.view,

				onClick: function (lng, lat, addr) {
					msg.removeClass("red").addClass("blue");
					msg.html(addr);
				},

				onSelect: function (lng, lat, addr) {
					if (cb) cb(lng, lat, addr);
					can_hide = true;
					main.modal("hide");
				}
			});
		});

		var can_hide = false;

		main.modal({
			allowMultiple: true,
			observeChanges: true,
			autofocus: false,

			closable: true,

			onHide: function () {
				if (config.view) return true;

				if (can_hide) return true;

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
		embed: embed,
		search: search
	};
});
