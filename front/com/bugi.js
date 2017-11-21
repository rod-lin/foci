/**
 * Error detecting & user-friendly handling module
 * Although relatively independent,
 * The core functions of bugi still require require.js, jQuery and part of semantic-ui(optional) to be working
 */

; "use strict";

(function () {
	var $ = jQuery;
	var bugi = {};

	var d = function (val, def) {
		return val === undefined ? def : val;
	};

	function BugiEnv() {
		this.url = window.location.href;
		
		this.foci_cc = foci ? foci.cache_control : "(foci not ready)";

		// this.head = $("head script").html();

		var n = navigator;
		this.nav = n ? {
			code_name: n.appCodeName,
			app_name: n.appName,
			version: n.appVersion,
			minor_version: n.appMinorVersion,
			cookie_enable: n.cookieEnabled,
			cpu_class: n.cpuClass,
			online: n.onLine,
			platform: n.platform,
			user_agent: n.userAgent,
			browser_language: n.browserLanguage,
			system_language: n.systemLanguage,
			user_language: n.userLanguage
		} : {};
	}

	// function getTrace(e) {
	// 	let stack = e.stack || "";
	// 	stack = stack.split("\n").map(function (line) { return line.trim(); });
	// 	return stack.splice(stack[0] == "Error" ? 2 : 1);
	// }

	function BugiError(exc, extra) {
		this.exc = exc;

		this.lineno = d(extra.lineno, -1);
		this.colno = d(extra.colno, -1);
		this.filename = d(extra.filename, "(unknown)");
		this.msg = d(extra.msg, "(no message)");
		this.time = d(extra.time, -1);

		this.gtime = (new Date()).toUTCString();

		this.stack = d(exc.stack, null);
	}

	function msgbox(msg, type) {
		try {
			require([ "com/util" ], function (util) {
				util.emsg(msg, type);
			});
		} catch (e) {
			alert(msg);
		}
	}

	function encodeMail(to, subject, body) {
		return "mailto:" + to +
			   "?subject=" + encodeURIComponent(subject) +
			   "&body=" + encodeURIComponent(body);
	}

	(function () {
		var foci = {};
		// rewrite foci.loadCSS so that mcom can inline and compress the code
		foci.loadCSS = function (path) {
			$("<link>")
				.attr({
					rel: "stylesheet",
					href: path + "?v=" + (new Date()).getTime()
				})
				.appendTo("head");
		};

		foci.loadCSSPlain = function (sheet) {
			$("head").append("<style>" + sheet + "</style>");
		};

		foci.loadCSS("com/bugi.css");
	})();

	var error_queue = [];

	bugi.report = function (report, cb, silent) {
		report = JSON.stringify(report);

		function suc() {
			if (!silent)
				msgbox("we really appreciate your support!", "success");
	
			if (cb) cb(true);
		}

		// send mail as a backup method
		function err() {
			if (silent) {
				if (cb) cb(false);
				return;
			}

			msgbox("couldn't send the message through internet. would you kindly send it through email?", "info");
			
			var subject = "Bugi - Report - " + (new Date()).getTime();
			var link = encodeMail("bug@m.foci.me", subject, report);
			window.location = link;

			setTimeout(function () {
				msgbox("we really appreciate your support!", "success");
				if (cb) cb();
			}, 3000);
		}

		$.ajax({
			method: "POST",
			url: "/bugi/report",
			dataType: "json",
			data: {
				time: (new Date()).getTime(),
				report: report
			},

			success: function (dat) {
				if (dat.suc) suc();
				else err();
			},

			error: function () {
				err();
			}
		});
	};

	// feedback
	bugi.fbmodal = function () {
		var modal = $("<div class='ui small modal com-bugi-fbmodal'> \
			<div class='title'>It would be really helpful if you could tell us what you are encountering</div> \
			<textarea class='input-no-style descr'></textarea> \
			<button class='ui button cancel-btn'>Cancel</button> \
			<button class='ui blue button report-btn'>Report</button> \
		</div>");

		modal.find(".cancel-btn").click(function () {
			modal.modal("hide");
		});

		modal.find(".report-btn").click(function () {
			modal.find(".report-btn").addClass("loading");

			var report = {
				descr: modal.find(".descr").val(),
				env: new BugiEnv(),
				errors: error_queue
			};

			bugi.report(report, function () {
				error_queue = [];
				modal.modal("hide");
			});
		});

		modal.modal({
			allowMultiple: true
		}).modal("show");
	};

	bugi.pop = function (err) {
		if (error_queue.length) {
			error_queue.push(err);
			return;
		}

		error_queue.push(err);

		var main = $("<div class='com-bugi-embox'> \
			<div class='prompt'> \
				<div class='msg'> \
					<div class='title'>Are you encountering a problem?</div> \
					We've detected <b class='error-prompt'></b> \
				</div> \
				<div class='choice-btn yes-btn'><i class='fitted check icon'></i></div> \
			</div> \
			<div class='warn-btn choice-btn'><i class='fitted warning icon'></i></div> \
		</div>");
		
		$("body").append(main);

		setTimeout(function () {
			main.addClass("show");
		}, 300);

		function hide() {
			main.css("width", "").addClass("hide");
		}

		main.find(".yes-btn").click(function () {
			bugi.fbmodal();
			hide();
		});

		main.find(".warn-btn").click(function () {
			if (!main.hasClass("expand")) {
				main.addClass("expand");

				var count = error_queue.length;

				main.find(".error-prompt").html(count + " error" + (count > 1 ? "s" : ""));

				var prompt_width = main.find(".prompt").width();
				var btn_width = main.find(".choice-btn").width();
				var cont_width = btn_width * 2 + prompt_width;

				if (cont_width > $(window).width()) {
					main.addClass("mobile-mode");
				}

				main.find(".warn-btn i").toggleClass("warning cancel");
				main.width(cont_width);
				main.height(main.find(".prompt .msg").height() + 10);
			} else {
				bugi.report({
					silent: true,
					env: new BugiEnv(),
					errors: error_queue
				}, null, true);

				hide();
			}
		});
	};

	bugi.handler = function (err) {
		bugi.pop(err);
	};

	$(window).on("error", function (ev) {
		ev = ev.originalEvent;

		return bugi.handler(new BugiError(ev.error, {
			lineno: ev.lineno,
			colno: ev.colno,
			filename: ev.filename,
			msg: ev.message,
			time: ev.timeStamp,
			path: ev.path
		}));
	});

	return bugi;
})();
