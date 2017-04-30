/* upload */

"use strict";

define([ "com/util" ], function (util) {
	var $ = jQuery;
	foci.loadCSS("com/upload.css");

	function init(cb) {
		var main = $(" \
			<div class='ui basic modal com-upload'> \
				<div class='exdim'></div> \
				<form class='ui form' enctype='multipart/form-data'> \
					<div class='field preview-cont' style='display: none;'> \
						<img class='ui medium rounded bordered image preview' src='img/tmp3.jpg'> \
					</div> \
					<div class='ui buttons'> \
						<button type='button' class='ui icon button exit-btn'> \
							<i class='remove icon'></i> \
						</button> \
						<button type='button' class='ui blue icon button select-btn'> \
							<i class='upload icon'></i> \
						</button> \
						<button type='button' class='ui green icon button use-btn'> \
							<i class='checkmark icon'></i> \
						</button> \
					</div> \
					<input class='file' name='file' type='file'> \
				</form> \
			</div> \
		");

		var selected = null;
		
		main.find(".select-btn").click(function () {
			main.find(".file").click();
		});

		main.find(".use-btn").click(function () {
			if (!selected) {
				util.qmsg("no file selected");
			} else {
				main.modal("hide");
				if (cb) cb(selected);
			}
		});

		function showPreview() {
			if (!selected) return;

			main.find(".preview-cont").css("display", "");
			main.find(".preview")
				.attr("src", foci.download(selected))
				.on("load", function () {
					main.modal("refresh");
				});

			return;
		}

		main.find(".file").change(function () {
			var val = $(this).val();
			if (val) {
				if (!FormData) {
					// TODO: fallback upload mode
					util.qmsg("eh... form data not supported");
					return;
				}

				main.find(".select-btn").addClass("loading");
				var form = new FormData(main.find("form")[0]);

				foci.post("/file/upload", form, function (suc, dat) {
					main.find(".select-btn").removeClass("loading");

					if (suc) {
						selected = dat;
						showPreview();
					} else {
						util.qmsg(dat);
					}
				});
			}
		});

		main.find(".exit-btn, .exdim").click(function () {
			main.modal("hide");
		});

		main.modal({
			allowMultiple: true,
			observeChanges: true,
			autofocus: false
		});

		main.modal("show");
	}

	return {
		init: init
	};
});
