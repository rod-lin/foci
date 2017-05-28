/* top bar */
"use strict";

define([ "com/login", "com/xfilt", "com/util", "com/env", "com/upload" ], function (login, xfilt, util, env, upload) {
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
					<div class="ui left action right icon input search-box"> \
						<button class="menu-btn"> \
							<i class="content icon" style="margin: 0;"></i> \
						</button> \
						<!--div class="tags">Hi</div--> \
						<div class="ui search fluid"> \
							<div class="filter-tag fluid ui multiple dropdown"> \
								<div class="ui fluid menu"> ' + /* tags add here! */ ' \
									<div class="header"> \
										<i class="tags icon"></i> \
										Add tag \
									</div> \
									<div class="scrolling menu"> \
										<div class="item" data-value="no-select" style="display: none;"> \
											dont select me \
										</div> \
									</div> \
								</div> \
							</div> \
							<input class="prompt" placeholder="Type for surprise" type="text"> \
						</div> \
						<i class="filter-btn filter link icon"></i> \
					</div> \
				</div> \
				<div class="menu-view"> \
					<div class="menu-cont"> \
						<i class="cancel icon"></i> \
						<a class="menu-link" href="#">HOME</a> \
						<a class="menu-link">PLAZA</a> \
					</div> \
				</div> \
				<div class="banner-view"> \
					<div class="banner"><i class="diamond icon"></i></div> \
				</div> \
				<div class="right-bar"> \
					<div class="avatar-box"> \
						<div class="avatar"></div> \
						<button class="login-btn"> \
							<div class="ui small loader"></div> \
							<i class="sign in icon"></i> \
						</button> \
					</div> \
					<div class="ui popup transition hidden"> \
						<div class="cont"> \
							<div class="pop-avatar"><div><i class="setting icon"></i></div></div> \
							<div class="pop-title header"></div> \
							<div class="ui star mini rating bottom right" data-rating="4" data-max-rating="5"></div> \
						</div> \
						<div class="ui two bottom attached buttons"> \
							<div class="ui button profile">Profile</div> \
							<div class="ui button logout">Logout</div> \
						</div> \
					</div> \
				</div> \
			</div> \
		';

		main = $(main);
		main.css("opacity", "0");
		main.ready(function () {
			main.css("opacity", "");
		});

		var showMenu, hideMenu;

		(function () {
			var proc;

			showMenu = function () {
				hideSearchResult();

				main.addClass("show-menu");
				main.removeClass("show-banner");
				main.css("overflow", "hidden");
				clearTimeout(proc);
			};

			hideMenu = function () {
				main.removeClass("show-menu");
				proc = setTimeout(function () {
					main.css("overflow", "");
				}, 300);
			};

			main.find(".menu-btn").click(showMenu);
			main.find(".menu-cont .cancel.icon").click(hideMenu);
			main.find(".menu-cont .menu-link").click(hideMenu);
		})();

		main.find(".filter-tag").dropdown({
			hideAdditions: true,

			onShow: function () {
				main.find(".filter-tag").css("pointer-events", "auto");
			},

			onHide: function () {
				main.find(".filter-tag").css("pointer-events", "none");
			},

			keys: {
				enter: -1 // avoid enter select
			}
		});

		var tag_dname = {}; // TODO: tag display name map
		var tag_selected = {};

		function getTag() {
			var ret = [];

			for (var k in tag_selected) {
				if (tag_selected.hasOwnProperty(k) && tag_selected[k]) {
					ret.push(k);
				}
			}

			return ret;
		}

		function clearTag() {
			tag_selected = {};
			main.find(".filter-btn").removeClass("active");
			main.find(".filter-tag .scrolling.menu .tag div").removeClass("blue").addClass("grey");
		}

		function addTag(name) {
			var tag = $(" \
				<div class='item tag filtered' style='display: block !important; font-weight: normal !important;'> \
					<div class='ui grey empty circular label'></div> \
				</div> \
			");
			
			tag.attr("data-value", name);
			tag.append(tag_dname.hasOwnProperty(name) ? tag_dname[name] : name);
			tag.click(function () {
				main.find(".filter-btn").addClass("active");
				tag_selected[name] = !tag_selected[name];
				tag.find("div").toggleClass("grey").toggleClass("blue");
			});

			main.find(".filter-tag .scrolling.menu").append(tag);
		}

		env.favtag(function (tags) {
			if (tags) for (var i = 0; i < tags.length; i++) {
				addTag(tags[i]);
			}
		});

		main.find(".filter-btn").click(function () {
			main.find(".filter-tag").dropdown("toggle");
		});

		/*** search util ***/
		var onsearch = null;

		var search = function (e, kw) {
			if (!e || e.keyCode == 13) {
				main.find(".prompt").blur();
				main.find(".search-box").addClass("loading");

				if (onsearch) {
					kw = kw || main.find(".prompt").val();
					onsearch({
						kw: kw,
						favtag: getTag()
					}, function () {
						main.find(".search-box").removeClass("loading");
					});

					clearTag();
				}
			}
		};

		main.find(".prompt").keydown(search);

		function hideSearchResult() {
			main.find(".search").search("hide results");
		}

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
			hideAvatar();
			main.find(".login-btn .loader").addClass("active");
			login.init(function (dat) {
				updateAvatar();
				if (!dat)
					main.find(".login-btn .loader").removeClass("active");
			});
		});

		var ava = main.find(".avatar");
		ava.popup({
			popup: main.find(".popup"),
			position: "bottom right",
			hoverable: true
		});

		function showAvatar() {
			main.find(".right-bar").addClass("logged");
		}

		function hideAvatar() {
			ava.popup("hide");
			main.find(".right-bar").removeClass("logged");
		}

		main.find(".popup .pop-avatar")
			.click(function () {
				upload.init(function (file) {
					if (file) {
						login.session(function () {
							// set avatar
							foci.encop(session, {
								int: "info",
								action: "set",
								avatar: file
							}, function (suc, dat) {
								if (suc) {
									updateAvatar(file);
								} else {
									util.emsg(dat);
								}
							});
						});
					}
				});
			});

		var old_info = null;
		function updateAvatar(file) {
			function refresh(info) {
				info = info || {};

				var dname = info.dname ? xfilt(info.dname) : "anonymous";
				var rating = info.rating ? Math.round(info.rating[0]) : "0";

				function update() {
					var url = info.avatar ? foci.download(info.avatar) : [ "img/deficon.jpg", "img/tmp3.jpg", "img/tmp4.jpg", "img/matt.jpg" ].choose();
					ava.css("background-image", "url(\'" + url + "\')");
					main.find(".popup .pop-avatar").css("background-image", "url(\'" + url + "\')");
					return url;
				}

				main.find(".rating")
					.attr("data-rating", rating.toString())
					.rating("disable");
				
				main.find(".popup .pop-title").html(dname);
				main.find(".popup .logout").click(function () {
					// ava.addClass("loading");
					env.logout(function () {
						updateAvatar();
					});
				});

				var url = update();

				util.img(url, function () {
					main.find(".login-btn .loader").removeClass("active");
					showAvatar();
					// main.find(".right-bar").prepend(ava);
				});

				// vcent.update();
			}

			if (env.session()) {
				env.user(function (info) {
					if (file) {
						info.avatar = file;
						old_info = null;
						refresh(info);
					} else {
						if (info !== old_info) {
							old_info = info;
							refresh(info);
						}
					}
				});
			} else {
				hideAvatar();
				old_info = null;
			}
		}

		var session = null;

		var ret = {
			search: function (cb) {
				onsearch = cb;
			},

			updateAvatar: function () {
				if (env.session() != session) {
					updateAvatar();
					session = env.session();
				}
			},

			setSimple: function () {
				main.addClass("simple");
			},

			delSimple: function () {
				main.removeClass("simple");
			},

			toggleSimple: function () {
				main.toggleClass("simple");
			},

			menu: function (cb) {
				// main.find(".menu-btn").click(cb);
			},

			toggleIcon: function (icon) {
				main.find(".menu-btn i")
					.toggleClass(icon)
					.toggleClass("content");
			},

			icon: function (icon) {
				main.find(".menu-btn i")
					.addClass(icon)
					.removeClass("content");
			},

			profile: function (cb) {
				main.find(".profile").click(cb);
			},

			showBanner: function () {
				hideSearchResult();
				main.addClass("show-banner");
				hideMenu();
			},

			hideBanner: function () {
				main.removeClass("show-banner");
			},

			setBanner: function (html) {
				main.find(".banner").html(html);
			},

			setTitle: function () {
				main.find(".banner").html(Array.prototype.slice.apply(arguments).join("<i class='sub caret right icon'></i>"));
			}
		};

		setInterval(ret.updateAvatar, 50);

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
