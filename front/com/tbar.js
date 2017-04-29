/* top bar */
"use strict";

define([ "com/login", "com/xfilt" ], function (login, xfilt) {
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
					<button class="ui grey basic icon button login-btn"> \
						<i class="user icon"></i> \
					</button> \
					<div class="ui popup transition hidden"> \
						<div class="cont"> \
							<div class="pop-avatar"></div> \
							<div class="title header"></div> \
							<div class="ui star mini rating bottom right" data-rating="4" data-max-rating="5"></div> \
						</div> \
						<div class="ui two bottom attached buttons" style="margin-bottom: -1px;"> \
							<div class="ui blue button">Profile</div> \
							<div class="ui button">Logout</div> \
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
		var session = null;

		main.find(".login-btn").click(function () {
			login.init(function (dat) {
				session = dat;
				loadAvatar();
			});
		});

		function loadAvatar() {
			if (!session) return;

			function refresh(info) {
				info = info || {};
				var url = info.avatar ? foci.download(info.avatar) : [ "img/deficon.jpg", "img/tmp3.jpg", "img/tmp4.jpg", "img/matt.jpg" ].choose();
				var ava = $('<div class="avatar" style="background-image: url(\'' + url + '\');"></div>');

				var dname = info.dname ? xfilt(info.dname) : "anonymous";
				var rating = info.rating ? Math.round(info.rating[0]) : "0";

				main.find(".rating")
					.attr("data-rating", rating.toString())
					.rating("disable");
				
				main.find(".popup .title").append(dname);
				main.find(".popup .pop-avatar").css("background-image", "url(\'" + url + "\')");

				main.find(".right-bar").prepend(ava);

				ava.popup({
					popup: $(".com-tbar").find(".popup"),
					position: "bottom right",
					hoverable: true
				});

				ava.click(function () {
					ava.popup("show");
				});

				main.find(".login-btn").css("display", "none");

				// vcent.update();
			}

			foci.encop(session, {
				int: "info",
				action: "get"
			}, function (suc, dat) {
				if (suc) {
					refresh(dat);
				} else {
					util.qmsg(dat);
				}
			});
		}

		var ret = {
			search: function (cb) {
				onsearch = cb;
			},

			updateAvatar: function () {
				foci.qlogin(function (suc, dat) {
					if (suc) {
						session = dat;
						loadAvatar();
					}
				});
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
