/* user search */

"use strict";

define([ "com/util", "com/avatar" ], function (util, avatar) {
	foci.loadCSS("com/userhunt.css");

	function modal(init /* init user list */, cb, config) {
		config = $.extend({
			prompt: "Selected user(s)",
			just_one: false
		}, config);

		var main = $(" \
			<div class='com-userhunt-modal ui small modal' style='padding: 1rem;'> \
				<div class='select-prompt'></div> \
				<div class='user-list'></div> \
				<div class='ui search user-search'> \
					<div class='ui icon input user-search-input'> \
						<input class='prompt' type='text' placeholder='Type to search user'> \
						<i class='search icon'></i> \
					</div> \
					<div class='results' style='width: 100%; position: static; box-shadow: none;'></div> \
				</div> \
			</div> \
		");

		var closebtn = $("<div class='close-btn'><i class='fitted minus icon'></i></div>");

		var selected = {};

		if (init)
			for (var i = 0; i < init.length; i++) {
				selected[init[i]] = true;
			}

		var once = false;

		main
			.modal({
				onHide: function () {
					if (once) return;
					once = true;

					var final = [];

					for (var k in selected) {
						if (selected.hasOwnProperty(k))
							final.push(k);
					}

					if (cb) cb(final);
				}
			})
			.modal("show");

		main.find(".select-prompt").html(config.prompt);

		$.fn.search.settings.templates.withicon = function (res) {
			res = res.results;

			var ret = "";

			if (res)
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

			return ret;
		};

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
				if (selected[res.uuid]) {
					util.emsg("already selected");
					return false;
				}

				if (config.exclude && config.exclude.indexOf(res.uuid) != -1) {
					util.emsg("this user is excluded");
					return false;
				}

				selected[res.uuid] = res;

				if (config.just_one) {
					main.modal("hide");
					return;
				}

				util.nextTick(function () {
					main.find(".ui.search .prompt").val("").focus();
				});

				var ava = avatar.init(main.find(".user-list"), res, { size: "3rem" });

				util.nextTick(function () {
					main.find(".ui.search .prompt").val("").focus();
				});

				ava.dom.append(closebtn.clone().click(function () {
					ava.dom.remove();
					delete selected[res.uuid];
				}));

				setTimeout(function () {
					main.modal("refresh");
				}, 500);
			}
		});

		var ret = {};

		return ret;
	}

	return { modal: modal };
});
