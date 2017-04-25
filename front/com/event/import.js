/* event */

/* require jQuery, semantic, waterfall, FCAuth */

if (!window.fcom) window.fcom = {};
if (!window.fcom.waterfall) console.log("require waterfall com");
if (!window.fcom.xfilt) console.log("require xfilt com");

(function (com) {
	com.init = function (cont) {
		cont = $(cont);
		var main = "<div class='com-events'></div>";
		main = $(main);
		cont.append(main);

		var wf = fcom.waterfall.init(main);

		function genDate(start, end) {
			var ret = "";
			var form = function (date) {
				return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
			};

			if (start) ret += form(new Date(start));
			else ret += "TBD";

			ret += " ~ ";

			if (end) ret += form(new Date(end));
			else ret += "TBD";

			return ret;
		}

		function genEvent(info) {
			return '<div class="ui card event"> \
				<div class="image"> \
					<img src="' + (info.logo ? FCAuth.download(info.logo) : "img/tmp1.jpg") + '"> \
				</div> \
				<div class="content"> \
					<a class="header">' + fcom.xfilt(info.title) + '</a> \
					<div class="meta"> \
						<span class="date">' + genDate(info.start, info.end) + '</span> \
					</div> \
					<div class="description"> \
						' + info.descr + ' \
					</div> \
				</div> \
				<div class="extra content"> \
					<a> \
						<i class="user icon"></i>' + (info.partic.length) + ' \
					</a> \
				</div> \
			</div>';
		}

		// TODO: S L O W !?
		function add(info) {
			wf.add(genEvent(info));
		}

		function clear() {
			child = [];
			main.html("");
		}

		return {
			add: add,
			clear: clear,

			hide: function () {
				main.css("display", "none").addClass("hide");
			},

			show: function () {
				main.css("display", "");
				wf.update();

				setTimeout(function () {
					main.removeClass("hide");
				}, 300);
			}
		};
	};
})(fcom.event = {});
