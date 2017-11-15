/* user search */

"use strict";

define([ "com/util", "com/avatar" ], function (util, avatar) {
	foci.loadCSS("com/userhunt.css");

	$.fn.search.settings.templates.withicon = function (res) {
		res = res.results;

		var ret = "";

		if (res) {
			for (var i = 0; i < res.length; i++) {
				ret += " \
					<div class='result" + (res[i].perfect ? " perfect" : "") + "'> \
						<div class='result-avatar' style='background-image: url(\"" + foci.download(res[i].avatar) + "\");'></div> \
						<div class='result-info'> \
							<div class='result-name title'>" + res[i].dname + "</div> \
							<div class='result-intro'>" + res[i].intro + "</div> \
						</div> \
						<div class='perfect-tag'>Accurate match</div> \
					</div> \
				";
			}
		}

		return ret;
	};
	
	var api = {};
	
	api.user = {
		url: "/user/search?kw={query}",

		onResponse: function (dat) {
			// console.log(dat);

			if (!dat.suc || !dat.res.length) return null;

			dat.res.sort(function (a, b) {
				return !!b.is_accurate - !!a.is_accurate;
			});

			// console.log(dat.res);

			for (var i = 0; i < dat.res.length; i++) {
				if (dat.res[i].is_accurate) {
					dat.res[i].perfect = true;
				}
			}

			return { results: dat.res };
		},
		
		onInfo: function (uid, cb) {
			util.userInfo(uid, function (dat) {
				cb(dat);
			})
		}
	};
	
	api.club = {
		url: "/club/search?kw={query}",
	
		onResponse: function (dat) {
			if (!dat.suc || !dat.res.length) return null;
			
			for (var i = 0; i < dat.res.length; i++) {
				dat.res[i] = {
					uuid: dat.res[i].cuid,
					dname: dat.res[i].dname,
					intro: dat.res[i].school,
					avatar: dat.res[i].logo
				};
			}
			
			return { results: dat.res };
		},
		
		onInfo: function (uid, cb) {
			foci.get("/club/info", { cuid: uid }, function (suc, dat) {
				if (suc) {
					cb({
						uuid: dat.cuid,
						dname: dat.dname,
						intro: dat.school,
						avatar: dat.logo
					});
				} else {
					util.emsg(dat);
				}
			});
		}
	};

	function modal(init /* init user list */, cb, config) {
		config = $.extend({
			prompt: "Selected user(s)",
			just_one: false,
			use_dragi: false,
			
			title: "Find user",
			
			// if defined otherwise, the dat should have { uuid, dname, avatar, intro(opt) }
			api: api.user,
			
			avatar_config: {}
		}, config);

		var main = $(" \
			<div class='com-userhunt-modal ui small modal'> \
				<div style='position: relative; padding: 1.5rem;'> \
					<div class='select-prompt'><i class='close-btn check icon'></i></div> \
					<div class='user-list'></div> \
					<div class='ui search user-search'> \
						<div class='ui icon input user-search-input'> \
							<input class='prompt' type='text' placeholder='Type to search'> \
							<i class='search icon'></i> \
						</div> \
						<div class='results' style='width: 100%; position: static; box-shadow: none;'></div> \
					</div> \
				</div> \
			</div> \
		");

		var delbtn = $("<div class='del-btn'><i class='fitted minus icon'></i></div>");

		// var selected = {};
		var selected = [];

		if (init) {
			for (var i = 0; i < init.length; i++) {
				config.api.onInfo(init[i], addSelected);
				// selected[init[i]] = true;
			}
		}

		var once = false;
		var onHide = function () {
			if (once) return;
			once = true;
			
			if (config.use_dragi) {
				main.dragi("hide");
			}

			setTimeout(function () {
				if (cb) {
					// BUG: if any of the procedure in cb contains modal with allowMultiple = false
					// this handler will be recursively called
					if (cb(selected) === false) {
						once = false;
						show();
						return;
					}
				}
				
				if (config.use_dragi) {
					main.dragi("close");
				}
			}, 500);
			
			if (config.use_dragi) {
				return false;
			}
		}
		
		function show() {
			if (config.use_dragi) {
				main.dragi("show");
			} else {
				main.modal("show");
			}
		}
		
		function hide() {
			if (config.use_dragi) {
				main.dragi("close");
			} else {
				main.modal("hide");
			}
		}

		if (config.use_dragi) {
			main.removeClass("ui small modal")
				.dragi({
					height: "auto",
					title: config.title,
					onClose: onHide
				});
		} else {
			main.modal({
					allowMultiple: true,
					onHide: onHide
				})
				.modal("show");
		}

		main.find(".select-prompt").prepend(config.prompt);
		main.find(".close-btn").click(function () {
			hide();
		});
		
		function addSelected(dat) {
			if (selected.indexOf(dat.uuid) != -1) {
				util.emsg("already selected");
				return false;
			}

			if (config.exclude && config.exclude.indexOf(dat.uuid) != -1) {
				util.emsg("this user is excluded");
				return false;
			}
			
			// selected[dat.uuid] = dat;
			selected.push(dat.uuid);
			
			if (config.just_one) {
				hide();
				return;
			}
			
			var ava = avatar.init(main.find(".user-list"), dat,
								  $.extend({ size: "4rem", can_jump: false }, config.avatar_config));

			ava.dom.append(delbtn.clone().click(function () {
				ava.dom.remove();
				
				var i = selected.indexOf(dat.uuid);
				selected.splice(i, 1);
			}));
		}

		main.find(".ui.search").search({
			type: "withicon",

			apiSettings: config.api,

			onSelect: function (res) {
				util.nextTick(function () {
					main.find(".ui.search .prompt").val("").focus();
				});

				if (!config.use_dragi) {
					setTimeout(function () {
						main.modal("refresh");
					}, 500);
				}
				
				return addSelected(res);
			}
		});

		var ret = {};

		return ret;
	}

	return {
		modal: modal,
		api: api
	};
});
