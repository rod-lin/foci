/* rating */

"use strict";

define([ "com/util" ], function (util) {
	foci.loadCSS("com/rating.css");

	function init(cont, rating, config) {
		cont = $(cont);
		config = $.extend({
			total: 5,
			max: 10,
			freeze: true,
			size: ""
		}, config);

		var main = $("<div class='com-rating ui star " + config.size + " rating' \
						   style='display: inline-block; margin: 0;' \
						   data-content=''></div>");

		cont.append(main);

		var ret = {
			set: function (r) {
				main.rating("set rating", Math.round(r / config.max * config.total));
				main.attr("data-html", "<span class='com-rating-tip'>" + util.trimFloat(r, 2) + "</span>");
			},

			get: function () {
				return main.rating("get rating") / config.total * config.max;
			},
			
			freeze: function () {
				main.rating("disable");
			},
			
			unfreeze: function () {
				main.rating("enable");
			}
		};

		// main.ready(function () {
		main.rating({
			initialRating: rating ? Math.round(rating / config.max * config.total) : 0,
			maxRating: 5
		});

		if (config.freeze) {
			main.rating("disable");
			main.popup({
				content: (rating === undefined ? "N/A" : util.trimFloat(rating, 2)),
				position: "right center",
				hoverable: true,
				variation: "inverted"
			});
			
			// alert(rating === undefined ? "N/A" : util.trimFloat(rating, 2));
			main.attr("data-html", "<span class='com-rating-tip'>" + (rating === undefined ? "N/A" : util.trimFloat(rating, 2)) + "</span>");
		}
		
		// });

		return ret;
	}
	
	function popup(btn, cb, config) {
		btn = $(btn);
		config = $.extend({
			prompt: "Choose a rating"
		}, config);
	
		var main = $("<div class='com-rating-popup ui popup'> \
		 	<div class='rating-prompt'></div> \
			<div class='rating-cont'></div> \
			<div style='position: relative;'> \
				<div class='ui tiny loader'></div> \
				<i class='rating-confirm check icon fitted'></i> \
			</div> \
		</div>");
		
		$("body").append(main);
		
		main.find(".rating-prompt").html(config.prompt);
		var rat = init(main.find(".rating-cont"), undefined, { freeze: false, size: "large" });
		
		var loading = false;
		
		btn.popup({
			popup: main,
			position: "bottom center",
			on: "click",
			
			onHide: function () {
				// no hiding when loading
				if (loading) {
					main.transition("pulse");
					return false;
				}
			}
		});
		
		main.find(".rating-confirm").click(function () {
			main.find(".loader").addClass("active");
			loading = true;
			
			rat.freeze();
			
			cb(rat.get(), function (suc) {
				main.find(".loader").removeClass("active");
				loading = false;
				
				if (suc) {
					btn.popup("hide");
				}
				
				rat.unfreeze();
			});
		});
	
		return {};
	}

	return {
		init: init,
		popup: popup
	};
})
