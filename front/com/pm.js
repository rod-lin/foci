/* personal message */

define([ "com/util", "com/login", "com/xfilt" ], function (util, login, xfilt) {
	foci.loadCSS("com/pm.css");

	function qview(cont, config) {
		cont = $(cont);
		config = $.extend({}, config)
	
		var main = $(" \
			<div class='com-pm-qview'> \
				<div class='msg-box'> \
					<div class='msg-box-cont'> \
						<div class='msg'> \
							<div class='sender-avatar'></div> \
							<div class='brief-info'> \
								<div class='sender-name'>Rodlin</div> \
								<div class='msg-cont'>Hello, my friend</div> \
							</div> \
							<div class='ellip'><i class='fitted ellipsis horizontal icon'></i></div> \
						</div> \
					</div> \
					<div class='prompt'></div> \
					<div class='main-loader ui loader active'></div> \
				</div> \
				<div class='bottom-bar'> \
					<div class='ui two bottom attached buttons' style='height: 100%;'> \
						<button class='ui basic button'><i class='write icon'></i>new</button> \
						<button class='ui basic button view-all-btn'>view all</button> \
					</div> \
				</div> \
			</div> \
		");

		cont.append(main);

		function setPrompt(msg) {
			main.find(".prompt").html(msg);
		}

		function genMsg(sender /* uuid */, msg) {
			var main = $(" \
				<div class='msg'> \
					<div class='sender-avatar'><div class='ui loader active'></div></div> \
					<div class='brief-info'> \
						<div class='sender-name'></div> \
						<div class='msg-cont'></div> \
					</div> \
					<div class='ellip'><i class='fitted ellipsis horizontal icon'></i></div> \
				</div> \
			");

			foci.get("/user/info", { uuid: sender }, function (suc, dat) {
				main.find(".loader").removeClass("active");

				if (suc) {
					dat = login.parseInfo(dat);
				} else {
					util.emsg(dat);
					dat = login.parseInfo({});
				}

				util.bgimg(main.find(".sender-avatar"), dat.avatar);
				main.find(".sender-name").html(dat.dname);
				main.find(".msg-cont").html(msg);
			});

			return main;
		}

		function getFirstMsg(dat) {
			var ret = [];

			for (var k in dat) {
				if (dat.hasOwnProperty(k) && dat[k].length) {
					ret.push(dat[k][dat[k].length - 1]);
				}
			}

			return ret;
		}

		main.find(".view-all-btn").click(function () {
			if (!has_view_all) {
				has_view_all = true;
				$(this).html("refresh");
			}

			ret.refresh();
		});

		var ret = {};
		var has_view_all = false;

		ret.refresh = function () {
			main.find(".msg-box-cont").html("");

			login.session(function (session) {
				if (!session) return;

				foci.encop(session, {
					int: "pm",
					action: has_view_all ? "getall" : "update"
				}, function (suc, dat) {
					main.find(".main-loader").removeClass("active");

					if (suc) {
						if (dat) {
							main.find(".msg-box").removeClass("empty");
							
							if (has_view_all)
								dat = getFirstMsg(dat);

							for (var i = 0; i < dat.length; i++) {
								main.find(".msg-box-cont").append(genMsg(dat[i].sender, dat[i].msg));
							}
						} else {
							main.find(".msg-box").addClass("empty");
							setPrompt(has_view_all ? "no conversation" : "no update");
						}
					} else {
						util.emsg(dat);
					}
				});
			});
		};

		var has_init = false;
		ret.init = function () {
			if (has_init) return;
			has_init = true;
			ret.refresh();
		};

		return ret;
	}

	return {
		qview: qview
	};
});
