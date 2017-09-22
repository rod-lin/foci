/* upload */

"use strict";

define([ "com/util" ], function (util) {
	var $ = jQuery;
	foci.loadCSS("com/upload.css");

	function field(cont, config) {
		cont = $(cont);
		config = $.extend({
			width: "5em",
			height: "5em",
			
			prompt: "Upload image",
			
			style: {}
		}, config);
		
		var main = $("<div class='com-upload-field'> \
			<div class='display'> \
				<span class='upload-prompt'></span> \
				<div class='ui loader'></div> \
			</div> \
			<div class='remove-btn'> \
				<i class='fitted cancel icon'></i> \
			</div> \
		</div>");
		
		var prompt = main.find(".upload-prompt");
		var display = main.find(".display");
		
		var uploaded = undefined;
		
		display.css($.extend(config.style, {
			width: config.width,
			height: config.height,
			"line-height": config.height
		}));
		
		prompt.html(config.prompt);
		
		function setVal(md5) {
			if (md5) {
				uploaded = md5;
				main.addClass("loaded");
				display.find(".loader").addClass("active");
				
				util.bgimg(display, foci.download(md5), function () {
					display.find(".loader").removeClass("active");
				});
			} else {
				uploaded = undefined;
				main.removeClass("loaded");
				util.bgimg(display, null);
			}
		}
		
		display.click(function () {
			init(function (md5) {
				if (md5) {
					setVal(md5);
				}
			});
		});
		
		main.find(".remove-btn").click(function () {
			setVal(null);
		});
		
		cont.append(main);
	
		var mod = {};
		
		mod.val = function (v) {
			if (v === undefined) {
				return uploaded;
			} else {
				setVal(v);
			}
		};
	
		return mod;
	}

	// function field(cb, config) {
	// 	config = $.extend({
	// 		title: "Title",
	// 		icon: "linkify"
	// 	}, config);
	// 	
	// 	var main = $("<div class='com-upload-field ui small modal' style='padding: 1rem;'> \
	// 		<div class='ui left icon input user-search'> \
	// 			<input class='prompt' type='text' placeholder='" + config.title +  "'> \
	// 			<i class='" + config.icon  + " icon'></i> \
	// 		</div> \
	// 	</div>");
	// 	
	// 	var returned = false;
	// 	
	// 	main.find(".prompt").keydown(function (e) {
	// 		if (e.which == 13) {
	// 			returned = true;
	// 			main.modal("hide");
	// 			e.preventDefault();
	// 			
	// 			cb(main.find(".prompt").val());
	// 		}
	// 	});
	// 	
	// 	main.modal({
	// 		onHide: function () {
	// 			if (!returned)
	// 				cb(null);
	// 		}
	// 	}).modal("show");
	// 	
	// 	return {};
	// }

	function init(cb, config) {
		config = $.extend({
			arg: null, // { prompt, placeholder, init }
			init: null // init file md5
		}, config);

		var main = $(" \
			<div class='ui basic modal com-upload'> \
				<div class='exdim'></div> \
				<form class='ui form' enctype='multipart/form-data'> \
					<div class='field preview-cont' style='display: none;'> \
						<img class='ui medium rounded bordered preview'></img> \
						<div class='ui labeled input upload-arg' style='margin-top: 0.5rem;'> \
							<div class='ui label'></div> \
							<input type='text'> \
						</div> \
						<input type='text' style='display: none;'> \
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
		var argfield = main.find(".upload-arg");

		function getArg() {
			return config.arg ? argfield.find("input").val() : undefined;
		}

		if (config.arg) {
			argfield.find(".label").html(config.arg.prompt);
			argfield.find("input").attr("placeholder", config.arg.placeholder);
			
			if (config.arg.init) {
				argfield.find("input").val(config.arg.init);
			}
		} else {
			argfield.remove();
		}

		main.find(".select-btn").click(function () {
			main.find(".file").click();
		});

		main.find(".use-btn").click(function () {
			if (!selected) {
				util.emsg("no file selected");
			} else {
				main.modal("hide");
				if (cb) cb(selected, getArg());
			}
		});

		function showPreview() {
			if (!selected) return;

			main.find(".preview-cont").css("display", "");
			main.find(".preview")
				.attr("src", foci.download(selected))
				.ready(function () {
					main.modal("refresh");
				}).on("load", function () {
					main.modal("refresh");
				});

			return;
		}

		main.find(".file").change(function () {
			var val = $(this).val();
			if (val) {
				if (!FormData) {
					// TODO: fallback upload mode
					util.emsg("$unsupported(FormData)");
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
						util.emsg(dat);
					}
				});
			}
		});
		
		if (config.init) {
			selected = config.init;
			showPreview();
		}

		main.find(".exit-btn, .exdim").click(function () {
			main.modal("hide");
			if (cb) cb(null, getArg());
		});

		main.modal({
			allowMultiple: true,
			observeChanges: true,
			autofocus: false
		});

		main.modal("show");
	}

	return {
		init: init,
		field: field
	};
});
