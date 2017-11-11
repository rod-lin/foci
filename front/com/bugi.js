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

	function BugiError(exc, extra) {
		this.exc = exc;

		this.lineno = d(extra.lineno, -1);
		this.colno = d(extra.colno, -1);
		this.filename = d(extra.filename, "(unknown)");
		this.msg = d(extra.msg, "(no message)");
		this.time = d(extra.time, -1);

		this.url = window.location;

		var n = navigator;
		this.env = n ? {
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

	var error_queue = [];

	// feedback
	bugi.fbmodal = function () {
		var modal = $("<div class='ui small modal com-bugi-fbmodal'> \
			<div class='title'>It would be really helpful if you could tell us what you are encountering</div> \
			<textarea class='input-no-style descr'></textarea> \
			<button class='ui right floated blue button report-btn'>Report</button> \
			<button class='ui right floated button cancel-btn'>Cancel</button> \
		</div>");

		function encodeMail(to, subject, body) {
			return "mailto:" + to +
				   "?subject=" + encodeURIComponent(subject) +
				   "&body=" + encodeURIComponent(body);
		}

		modal.find(".cancel-btn").click(function () {
			modal.modal("hide");
		});

		modal.find(".report-btn").click(function () {
			var body = JSON.stringify({
				descr: modal.find(".descr").val(),
				errors: error_queue
			});

			var subject = "Bugi - Bug Report - " + (new Date()).getTime();

			var link = encodeMail("bug@m.foci.me", subject, body);
			modal.find(".report-btn").addClass("loading");
			window.location = link;

			setTimeout(function () {
				modal.modal("hide");

				try {
					require([ "com/util" ], function (util) {
						util.emsg("Thank you for your support!", "success");
					});

					error_queue = [];
				} catch (e) {}
			}, 3000);
		});

		modal.modal("show");
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
