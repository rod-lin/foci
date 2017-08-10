/* login ui */

"user strict";

define([ "com/util", "com/env", "com/xfilt", "com/lang" ], function (util, env, xfilt, lang) {
	var $ = jQuery;
	foci.loadCSS("com/login.css");

	var all_cb = [];
	var opened = false;

	function resolveAllCallback(session) {
		for (var i = 0; i < all_cb.length; i++) {
			all_cb[i](session);
		}

		all_cb = [];
	}

	function parseInfo(info, config) {
		config = $.extend({}, config);

		var parsed = $.extend({}, info);

		parsed.avatar = info.avatar ? foci.download(info.avatar) : "img/def/avatar.jpg";
		parsed.dname = info.dname ? xfilt(util.short(info.dname, 12)) : lang.msg("$front.sub.profile.anonymous");
		parsed.intro = info.intro ? xfilt(util.short(info.intro, 128)) : lang.msg("($front.sub.profile.no_intro)");
		parsed.favtag = info.favtag ? info.favtag : [];
		parsed.rating = info.rating ? (info.rating[0] + info.rating[1]) / 2 : 0;

		return parsed;
	}
	
	function vercode(uname_input, veribtn, config) {
		config = $.extend({
			forgot: false
		}, config);
		
		function freezeCount(sec) {
			var orig = veribtn.html();

			veribtn.addClass("disabled");

			veribtn.html(sec + "s");

			var proc = setInterval(function () {
				if (!--sec) {
					clearInterval(proc);
					veribtn.removeClass("disabled").html(orig);
				} else {
					veribtn.html(sec + "s");
				}
			}, 1000);
		}
		
		veribtn.click(function () {
			var uname = uname_input.val();
			var type;

			if (uname.indexOf("@") != -1)
				type = "email";
			else if (uname.length == 11)
				type = "phone"
			else {
				uname_input.attr("placeholder", lang.msg("$front.com.login.illegal_user_name")).parent().addClass("error");
				uname_input.focus();
				return;
			}

			var next = function (suc, dat) {
				veribtn.removeClass("loading");

				if (suc) {
					freezeCount(60);
				} else {
					util.emsg(dat);
				}
			};

			veribtn.addClass("loading");

			if (type == "phone")
				foci.get("/smsg/vercode", { phone: uname, forgot: config.forgot }, next);
			else
				foci.get("/mail/vercode", { email: uname, forgot: config.forgot }, next);

			// util.atimes(function () {
			// 	main.modal("refresh");
			// }, 5);
		});
		
		return {};
	}

	function init(cb) {
		if (cb) all_cb.push(cb);

		if (opened) return;

		var main = $(" \
			<div class='ui basic modal com-login'> \
				<div class='exdim'></div> \
				<form class='ui form'> \
					<div class='top-banner'> \
						<div class='banner-cont'> \
							<div style='font-weight: bold;' class='lang' data-replace='$core.foci'>Foci</div> \
							<div style='font-size: 60%; margin-top: 0.8rem;' class='lang' data-replace='$front.com.login.logo_prompt'>Experiences worth sharing</div> \
						</div> \
					</div> \
					<!--div class='avatar' style='background-image: url(\"/img/deficon.jpg\");'></div--> \
					<div class='form-wrap'> \
						<div class='field' style='margin-bottom: 2rem !important;'> \
							<div class='field'><input class='uname' style='border-radius: 3px 3px 0 0; margin-bottom: 1px;'></div> \
							<div class='vercode-field'><div class='ui grid'> \
								<div class='nine wide column password-col field' style='padding-right: 0;'> \
									<input class='vercode' style='border-radius: 0 0 0 3px;'> \
								</div> \
								<div class='seven wide column get-code-col' style='padding-left: 1px;'> \
									<button class='ui basic button fluid vercode-btn lang' style='border-radius: 0; height: 100%;' type='button' data-replace='$front.com.login.verify'>Verify</button> \
								</div> \
							</div></div> \
							<div class='field' style='position: relative;'> \
								<input class='passwd' type='password' style='border-radius: 0 0 3px 3px; margin-top: 1px;'> \
								<div class='forgot-btn avcenter'>Forgot</div> \
							</div> \
						</div> \
						<div class='ui fluid buttons'> \
							<button class='reg ui button lang' type='button' data-replace='$front.com.login.register'>Register</button> \
							<div class='or' data-text='or' type='button'></div> \
							<button class='login ui positive button lang' type='button' data-replace='$front.com.login.login'>Login</button> \
						</div> \
					</div> \
				</form> \
			</div> \
		");

		lang.update(main);

		var uname_input = main.find(".uname");
		var passwd_input = main.find(".passwd");

		function restore() {
			main.find(".error").removeClass("error");
			main.find(".uname").attr("placeholder", lang.msg("$front.com.login.user_name"));
			main.find(".passwd").attr("placeholder", lang.msg("$front.com.login.passwd"));
			main.find(".vercode").attr("placeholder", lang.msg("$front.com.login.code"));
		}

		restore();
		
		vercode(uname_input, main.find(".vercode-btn"));

		main.find(".reg.button").click(function () {
			restore();

			var show = main.find(".form").toggleClass("show-reg").hasClass("show-reg");

			if (show) {
				login_btn.off("click", loginProc).click(regFinishProc).html(lang.msg("$front.com.login.finish"));
				main.find(".reg.button").html(lang.msg("$front.com.login.back"));
			} else {
				login_btn.click(loginProc).off("click", regFinishProc).html(lang.msg("$front.com.login.login"));
				main.find(".reg.button").html(lang.msg("$front.com.login.register"));
			}
		});

		function regFinishProc() {
			var uname = uname_input.val();
			var vercode = main.find(".vercode").val();
			var passwd = passwd_input.val();

			if (vercode.length < 4) {
				util.emsg("invalid verification code");
				return;
			}
			
			if (passwd < 6) {
				util.emsg("password too weak");
				return;
			}

			login_btn.addClass("loading");

			foci.newUser(uname, vercode, passwd, function (suc, dat) {
				login_btn.removeClass("loading");

				if (suc) {
					util.emsg("$def.register_suc", "success");
					main.find(".reg.button").click();
					login_btn.click();
				} else {
					util.emsg(dat);
				}
			});
		}

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
				uname_input.attr("placeholder", lang.msg("$front.com.login.empty_name")).parent().addClass("error");
				uname_input.focus();
				ret = false;
			}

			if (!passwd) {
				passwd_input.attr("placeholder", lang.msg("$front.com.login.empty_passwd")).parent().addClass("error");
				ret = false;
			}

			return ret;
		}

		var finished = false;

		var login_btn = main.find(".login.button");
		function loginProc() {
			if (!check()) return;

			login_btn
				.off("click", loginProc)
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
					resolveAllCallback(dat);
					env.emit("loginchange");
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
		
		main.find(".forgot-btn").click(function () {
			util.jump("#forgotpass");
			main.modal("hide");
		});

		main.modal({
			allowMultiple: true,
			onHidden: function () {
				if (!finished) resolveAllCallback(null);
				opened = false;
			}
		});

		opened = true;
		main.modal("show");

		main.find(".exdim").click(function () {
			main.modal("hide");
		});
	}

	return {
		init: init,
		parseInfo: parseInfo,
		vercode: vercode,
		session: function (cb) {
			if (!env.session()) {
				this.init(cb);
			} else {
				cb(env.session());
			}
		}
	};
});
