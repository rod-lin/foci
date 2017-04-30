/* top bar */
"use strict";

define([ "com/login", "com/xfilt", "com/util", "com/env" ], function (login, xfilt, util, env) {
	var $ = jQuery;
	foci.loadCSS("com/tbar.css");

	var instance = [];

	function init(config) {
		config = $.extend({
			max_search_res: 7
		}, config);

		var main = ' \
			<div class="com-tbar hide"> \
				<div class="left-bar"> \
					<div class="ui left action input search-box"> \
						<div class="ui basic floating dropdown button"> \
							<div class=""><i class="content icon" style="margin: 0;"></i></div> \
							<div class="menu"> \
								<div class="item">Home</div> \
								<div class="item">Plaza</div> \
							</div> \
						</div> \
						<div class="ui search"> \
							<input class="prompt" placeholder="Type for surprise" type="text"> \
						</div> \
						<div class="results"></div> \
					</div> \
					<!--div class="links"> \
						<div class="link">home</div> \
						<div class="link">plaza</div> \
					</div--> \
				</div> \
				<div class="right-bar"> \
					<button class="ui black icon button login-btn"> \
						<i class="rocket icon"></i> \
					</button> \
					<div class="ui popup transition hidden"> \
						<div class="cont"> \
							<div class="pop-avatar"></div> \
							<div class="title header"></div> \
							<div class="ui star mini rating bottom right" data-rating="4" data-max-rating="5"></div> \
						</div> \
						<div class="ui two bottom attached buttons" style="margin-bottom: -1px;"> \
							<div class="ui blue button">Profile</div> \
							<div class="ui button logout">Logout</div> \
						</div> \
					</div> \
				</div> \
			</div> \
		';

		main = $(main);

		main.find(".ui.dropdown").dropdown();

		/*** search util ***/
		var onsearch = null;

		var search = function (e, kw) {
			if (!e || e.keyCode == 13) {
				main.find(".prompt").blur();

				if (onsearch) {
					onsearch(kw || main.find(".prompt").val());
				}
			}
		};

		main.find(".prompt").keydown(search);

		main.find(".search").search({
			apiSettings: {
				url: "/event/search?kw={query}",
				onResponse: function(resp) {
					var ret = [];

					if (resp.suc) {
						var len =
							config.max_search_res < resp.res.length
							? config.max_search_res : resp.res.length;

						// alert("here");

						for (var i = 0; i < len; i++) {
							// alert(resp.res[i].title);
							ret.push({
								title: resp.res[i].title,
								// description: resp.res[i].descr,
								euid: resp.res[i].euid
							});
						}

						return { results: ret };
					} else {
						console.log("failed to connect to the server");
					}
				}
			},

			onSelect: function (arg) {
				search(null, arg.title);
			}
		});

		/*** login ***/
		main.find(".login-btn").click(function () {
			$(this).addClass("loading");
			login.init(function (dat) {
				if (dat) {
					loadAvatar();
				} else {
					main.find(".login-btn").removeClass("loading");
				}
			});
		});

		function loadAvatar() {
			function refresh(info) {
				info = info || {};
				var url = info.avatar ? foci.download(info.avatar) : [ "img/deficon.jpg", "img/tmp3.jpg", "img/tmp4.jpg", "img/matt.jpg" ].choose();
				var ava = $('<div class="avatar" style="background-image: url(\'' + url + '\');"></div>');

				var dname = info.dname ? xfilt(info.dname) : "anonymous";
				var rating = info.rating ? Math.round(info.rating[0]) : "0";

				main.find(".rating")
					.attr("data-rating", rating.toString())
					.rating("disable");
				
				main.find(".popup .title").html(dname);
				main.find(".popup .pop-avatar").css("background-image", "url(\'" + url + "\')");
				main.find(".popup .logout").click(function () {
					// ava.addClass("loading");
					env.logout(function () {
						ava.popup("hide");
						ava.remove();
						main.find(".login-btn").css("display", "");
					});
				});

				main.find(".right-bar").prepend(ava);

				ava.popup({
					popup: main.find(".popup"),
					position: "bottom right",
					hoverable: true
				});

				ava.ready(function () {
					main.find(".login-btn").removeClass("loading");
					main.find(".login-btn").css("display", "none");
				});

				// vcent.update();
			}

			env.user(function (info) {
				refresh(info);
			});
		}

		var ret = {
			search: function (cb) {
				onsearch = cb;
			},

			updateAvatar: function () {
				if (env.session())
					loadAvatar();
			}
		};

		ret.updateAvatar();

		$("body").prepend(main);

		main.ready(function () {
			// vcent.update();
			setTimeout(function () {
				main.removeClass("hide");
			}, 200);
		});

		instance.push(ret);

		return ret;
	};

	return {
		init: init
	}
});
