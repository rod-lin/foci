/* login ui */

"user strict";

define([ "com/util", "com/env" ], function (util, env) {
	var $ = jQuery;
	foci.loadCSS("com/login.css");

	function init(cb) {
		var main = $(" \
			<div class='ui basic modal com-login'> \
				<div class='exdim'></div> \
				<form class='ui form'> \
					<div class='field'> \
						<div class='avatar' style='background-image: url(\"/img/deficon.jpg\");'></div> \
					</div> \
					<div class='field'> \
						<input class='uname' placeholder='uesr name'> \
					</div> \
					<div class='field'> \
						<input class='passwd' placeholder='password' type='password'> \
					</div> \
					<div class='ui buttons'> \
						<button class='reg ui button' type='button'>Register</button> \
						<div class='or' data-text='or' type='button'></div> \
						<button class='login ui positive button' type='button'>Login</button> \
					</div> \
				</form> \
			</div> \
		");

		var uname_input = main.find(".uname");
		var passwd_input = main.find(".passwd");

		uname_input.keydown(function (e) {
			uname_input.parent().removeClass("error");

			if (e && e.keyCode == 13) {
				passwd_input.focus();
			}
		});

		passwd_input.keydown(function (e) {
			passwd_input.parent().removeClass("error");

			if (e && e.keyCode == 13) {
				login_btn.click();
			}
		});

		function check() {
			var uname = uname_input.val();
			var passwd = passwd_input.val();
			var ret = true;

			if (!uname) {
				uname_input.attr("placeholder", "user name cannot be empty").parent().addClass("error");
				uname_input.focus();
				ret = false;
			}

			if (!passwd) {
				passwd_input.attr("placeholder", "password cannot be empty").parent().addClass("error");
				ret = false;
			}

			return ret;
		}

		var finished = false;

		var login_btn = main.find(".login.button");
		var login_proc = function () {
			if (!check()) return;

			login_btn
				.off("click")
				.addClass("loading");

			var uname = uname_input.val();
			var passwd = passwd_input.val();

			// var backup = login_btn.html();
			// var suc = "<i class='checkmark icon'></i>";
			// var fail = "<i class='warning icon'></i>";

			foci.login(uname, passwd, function (suc, dat) {
				if (suc) {
					main.modal("hide");
					env.session(dat);
					finished = true;
					if (cb) cb(dat);
				} else {
					// login_btn.html(fail);
					util.qmsg(dat);
				}

				setTimeout(function () {
					login_btn
						.removeClass("loading")
						.click(login_proc);
				}, 500);
			});
		};

		login_btn.click(login_proc);

		main.find(".exdim").click(function () {
			main.modal("hide");
		});

		main.modal({
			allowMultiple: true,
			onHidden: function () {
				if (!finished && cb) cb(null);
			}
		});

		main.modal("show");
	}

	return {
		init: init
	};
});
