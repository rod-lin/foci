/* login ui */

"user strict";

define([ "com/util" ], function (util) {
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

		var login_btn = main.find(".login.button");
		var login_proc = function () {
			login_btn
				.off("click")
				.addClass("loading");

			var uname = main.find(".uname").val();
			var passwd = main.find(".passwd").val();

			// var backup = login_btn.html();
			// var suc = "<i class='checkmark icon'></i>";
			// var fail = "<i class='warning icon'></i>";

			foci.login(uname, passwd, function (suc, dat) {
				if (suc) {
					main.modal("hide");
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
			allowMultiple: true
		});

		main.modal("show");
	}

	return {
		init: init
	};
});
