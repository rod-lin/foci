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
					<div class='avatar' style='background-image: url(\"/img/deficon.jpg\");'></div> \
					<div class='field' style='margin-bottom: 1.5rem !important;'> \
						<div class='field'><input class='uname' style='border-radius: 3px 3px 0 0; margin-bottom: 1px;'></div> \
						<div class='vercode-field'><div class='ui grid'> \
							<div class='nine wide column password-col field' style='padding-right: 0;'> \
								<input class='vercode' style='border-radius: 0 0 0 3px;'> \
							</div> \
							<div class='seven wide column get-code-col' style='padding-left: 1px;'> \
								<button class='ui basic button fluid vercode-btn' style='border-radius: 0; height: 100%;' type='button'>Verify</button> \
							</div> \
						</div></div> \
						<div class='field'><input class='passwd' type='password' style='border-radius: 0 0 3px 3px; margin-top: 1px;'></div> \
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

		function restore() {
			main.find(".error").removeClass("error");
			main.find(".uname").attr("placeholder", "phone number");
			main.find(".passwd").attr("placeholder", "passwd");
			main.find(".vercode").attr("placeholder", "code");
		}

		restore();

		main.find(".reg.button").click(function () {
			restore();

			var show = main.find(".form").toggleClass("show-reg").hasClass("show-reg");
			
			if (show) {
				login_btn.off("click", loginProc).click(regFinishProc).html("Finish");
				main.find(".reg.button").html("Back");
			} else {
				login_btn.click(loginProc).off("click", regFinishProc).html("Login");
				main.find(".reg.button").html("Register");
			}
		});

		function regFinishProc() {
			var uname = uname_input.val();
			var vercode = main.find(".vercode").val();
			var passwd = passwd_input.val();

			foci.newUser(uname, vercode, passwd, function (suc, dat) {
				if (suc) {
					util.emsg("$def.register_suc");
					main.find(".reg.button").click();
				} else {
					util.emsg(dat);
				}
			});
		}

		function freezeCount(sec) {
			var btn = main.find(".vercode-btn");
			var orig = btn.html();

			btn.addClass("disabled");

			btn.html(sec + "s");

			var proc = setInterval(function () {
				if (!--sec) {
					clearInterval(proc);
					btn.removeClass("disabled").html(orig);
				} else {
					btn.html(sec + "s");
				}
			}, 1000);
		}

		main.find(".vercode-btn").click(function () {
			var uname = uname_input.val();

			if (uname.length === 11) {
				main.find(".vercode-btn").addClass("loading");

				foci.get("/smsg/vercode", { phone: uname }, function (suc, dat) {
					main.find(".vercode-btn").removeClass("loading");
					
					if (suc) {
						freezeCount(60);
					} else {
						util.emsg(dat);
					}
				});
			} else {
				uname_input.attr("placeholder", "illegal phone number").parent().addClass("error");
				uname_input.focus();
			}

			// util.atimes(function () {
			// 	main.modal("refresh");
			// }, 5);
		});

		uname_input.keyup(function (e) {
			uname_input.parent().removeClass("error");

			if (e && e.keyCode == 13) {
				passwd_input.focus();
			}
		});

		passwd_input.keyup(function (e) {
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
		function loginProc() {
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
					util.emsg(dat);
				}

				setTimeout(function () {
					login_btn
						.removeClass("loading")
						.click(loginProc);
				}, 500);
			});
		};

		login_btn.click(loginProc);

		main.modal({
			allowMultiple: true,
			onHidden: function () {
				if (!finished && cb) cb(null);
			}
		});

		main.modal("show");

		main.find(".exdim").click(function () {
			main.modal("hide");
		});
	}

	return {
		init: init,
		session: function (cb) {
			if (!env.session()) {
				this.init(cb);
			} else {
				cb(env.session());
			}
		}
	};
});
