/* user search */

"use strict";

define([ "com/util", "com/avatar" ], function (util, avatar) {
	foci.loadCSS("com/userhunt.css");

	function modal(init /* init user list */, cb, config) {
		config = $.extend({
			prompt: "Selected user(s)",
			just_one: false,
			use_dragi: false,
			
			title: "Find user"
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

		var selected = {};

		if (init) {
			for (var i = 0; i < init.length; i++) {
				foci.get("/user/info", { uuid: init[i] }, function (suc, dat) {
					if (suc) {
						addSelected(dat);
					} else {
						util.emsg(dat);
					}
				});
				
				// selected[init[i]] = true;
			}
		}

		var once = false;
		var onHide = function () {
			if (once) return;
			once = true;

			var final = [];

			for (var k in selected) {
				if (selected.hasOwnProperty(k)) {
					// alert("hi");
					final.push(parseInt(k));
				}
			}

			if (cb) cb(final);
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

		$.fn.search.settings.templates.withicon = function (res) {
			res = res.results;

			var ret = "";

			if (res) {
				for (var i = 0; i < res.length; i++) {
					ret += " \
						<div class='result'> \
							<div class='result-avatar' style='background-image: url(\"" + foci.download(res[i].avatar) + "\");'></div> \
							<div class='result-info'> \
								<div class='result-name title'>" + res[i].dname + "</div> \
								<div class='result-intro'>" + res[i].intro + "</div> \
							</div> \
						</div> \
					";
				}
			}

			return ret;
		};
		
		function addSelected(dat) {
			if (selected[dat.uuid]) {
				util.emsg("already selected");
				return false;
			}

			if (config.exclude && config.exclude.indexOf(dat.uuid) != -1) {
				util.emsg("this user is excluded");
				return false;
			}
			
			selected[dat.uuid] = dat;
			
			if (config.just_one) {
				hide();
				return;
			}
			
			var ava = avatar.init(main.find(".user-list"), dat, { size: "4rem", can_jump: false });

			ava.dom.append(delbtn.clone().click(function () {
				ava.dom.remove();
				delete selected[dat.uuid];
			}));
		}

		main.find(".ui.search").search({
			type: "withicon",

			apiSettings: {
				url: "/user/search?kw={query}",

				onResponse: function (dat) {
					// console.log(dat);

					if (!dat.suc || !dat.res.length) return null;

					// console.log(ret);

					return { results: dat.res };
				}
			},

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

	return { modal: modal };
});
