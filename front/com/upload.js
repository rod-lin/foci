/* upload */

"use strict";

define([ "com/util", "com/login" ], function (util, login) {
	var $ = jQuery;
	foci.loadCSS("com/upload.css");

	function field(cont, config) {
		cont = $(cont);
		config = $.extend({
			width: "5em",
			height: "5em",

			max_width: undefined,
			
			prompt: "Upload image",
			
			style: {}
		}, config);
		
		var main = $("<div class='com-upload-field'> \
			<div class='display'> \
				<span class='upload-prompt'></span> \
				<div class='ui active loader'></div> \
			</div> \
			<div class='remove-btn'> \
				<i class='fitted cancel icon'></i> \
			</div> \
		</div>");
		
		var prompt = main.find(".upload-prompt");
		var display = main.find(".display");
		var loader = display.find(".loader");

		var uploaded = undefined;
		
		main.css("max-width", config.max_width)

		display.css($.extend(config.style, {
			width: config.width,
			height: config.height,
			"line-height": config.height
		}));

		loader.css("display", "none");
		
		prompt.html(config.prompt);
		
		function setVal(md5) {
			if (md5) {
				uploaded = md5;
				main.addClass("loaded");
				loader.css("display", "");
				
				util.bgimg(display, foci.download(md5), function () {
					loader.css("display", "none");
				});
			} else {
				uploaded = undefined;
				main.removeClass("loaded");
				loader.css("display", "none");
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

	function init(cb, config) {
		config = $.extend({
			arg: null, // { prompt, placeholder, init }
			init: null, // init file md5
			
			crop: {
				ratio: NaN,
				
			}
		}, config);

		var main = $(" \
			<div class='ui basic modal com-upload'> \
				<div class='exdim'></div> \
				<form class='ui form' enctype='multipart/form-data'> \
					<div class='field preview-cont'> \
						<img class='ui medium rounded bordered preview'></img> \
						<div class='drop-area'> \
							Drag & drop the image \
						</div> \
						<div class='ui labeled input upload-arg' style='margin-top: 0.5rem;'> \
							<div class='ui label'></div> \
							<input type='text'> \
						</div> \
						<input type='text' style='display: none;'> \
						<div class='load-overlay'> \
							<div class='prog-prompt avcenter'></div> \
						</div> \
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
		
		main.find(".drop-area").click(function () {
			main.find(".file").click();
		});
		
		main.on({
			dragleave: function (e) {
				e.preventDefault();
			},
			
			drop: function (e) {
				e.preventDefault();
			},
			
			dragenter: function (e) {
				e.preventDefault();
			},
			
			dragover: function (e) {
				e.preventDefault();
			}
		});
		
		function dropEvent(e) {
			e = e.originalEvent;
			
			if (e.dataTransfer && e.dataTransfer.files) {
				var files = e.dataTransfer.files;
				
				if (files.length) {
					main.find(".file")[0].files = files;
					// main.find(".file").change();
				} else {
					util.emsg("no file selected");
				}
			} else {
				util.emsg("drag & drop not supported");
			}
		}
		
		main.find(".preview-cont").on("drop", dropEvent);
		// main.find(".drop-area").on("drop", dropEvent);

		main.find(".select-btn").click(function () {
			main.find(".file").click();
		});

		var use_lock = false;

		main.find(".use-btn").click(function () {
			if (use_lock) return;

			if (!main.find(".preview").attr("src")) {
				util.emsg("no file selected");
			} else {
				use_lock = true;

				var next = function () {
					var canvas = main.find(".preview").cropper("getCroppedCanvas");
					
					if (!canvas.toBlob) {
						// TODO: fallback
						util.emsg("$unsupported(canvas.toBlob)");
						use_lock = false;
						return;
					}

					var prog = main.find(".prog-prompt");

					prog.html("");
					main.find(".preview").cropper("disable");
					main.find(".use-btn").addClass("loading");
					main.addClass("uploading");
					
					canvas.toBlob(function (blob) {
						var form = new FormData();
						
						form.append("file", blob);

						// if local, no cap
						(function () {
							if (foci.local) {
								foci.post.apply(foci, arguments);
							} else {
								foci.capwrap.apply(foci, arguments);
							}
						}).apply(null, ["/file/upload", form, function (suc, dat) {
							use_lock = false;
							main.removeClass("uploading");
							main.find(".use-btn").removeClass("loading");
							main.find(".preview").cropper("enable");
							
							if (suc) {
								main.modal("hide");
								if (cb) cb(dat, getArg());
							} else {
								util.emsg(dat);
							}
						}, {
							xhr: function() {
								var xhr = $.ajaxSettings.xhr();
								
								if (xhr.upload) {
									xhr.upload.addEventListener("progress", function (ev) {
										if (ev) {
											var prompt = util.trimFloat(ev.loaded / 1024, 2) + " K";

											if (ev.lengthComputable) {
												prompt += "(" + util.trimFloat(ev.loaded / ev.total * 100, 2) + "%)";
											}

											prog.html(prompt);
										}
									}, false);
								}
								
								return xhr;
							}
						}]);
					});
				};

				if (crop_ready) {
					next();
				} else if (config.init && selected == config.init) {
					// init image not changed
					use_lock = false;
					if (cb) cb(selected, getArg());
					main.modal("hide");
				} else {
					use_lock = false;
					util.emsg("cropper not ready, please wait", "info");
					// crop_ready_cb.push(next);
				}
			}
		});

		var has_init = false;
		var hide_locked = false;

		var crop_ready = false;
		var crop_ready_cb = [];

		function showPreview(disable_crop, data_url) {
			if (!selected && !data_url) return;

			// main.find(".preview-cont").css("display", "");
			main.addClass("loaded");
			
			if (has_init)
				main.find(".preview").cropper("destroy");
			
			if (!disable_crop)
				has_init = true;
			
			main.find(".preview")
				.attr("src", data_url ? data_url : foci.download(selected, { tmp: !disable_crop }))
				.ready(function () {
					main.modal("refresh");
				}).on("load", function () {
					main.modal("refresh");
				});
			
			if (!disable_crop)	
				main.find(".preview").cropper({
					aspectRatio: config.crop.ratio,
					checkCrossOrigin: true,

					ready: function () {
						crop_ready = true;

						for (var i = 0; i < crop_ready_cb.length; i++) {
							crop_ready_cb[i]();
						}

						crop_ready_cb = [];
					},
					
					cropstart: function () {
						hide_locked = true;
					},
					
					cropend: function () {
						setTimeout(function () {
							hide_locked = false;
						}, 100);
					}
				});

			return;
		}

		main.find(".file").change(function () {
			if (!$(this).val()) return;
			
			var self = this;
			
			var next = function () {
				if (!FormData) {
					// TODO: fallback upload mode
					util.emsg("$unsupported(FormData)");
					return;
				}
				
				var objurl = null;
				
				if (self.files && self.files[0])
				 	objurl = util.createObjectURL(self.files[0]);
				
				// support local preview
				if (objurl) {
					showPreview(false, objurl);
				} else {
					main.find(".select-btn").addClass("loading");
					
					var form = new FormData(main.find("form")[0]);
					
					// store local file to prevent CORS
					form.append("tmp", true);

					foci.capwrap(foci.post, "/file/upload", form, function (suc, dat) {
						main.find(".select-btn").removeClass("loading");

						if (suc) {
							selected = dat;
							showPreview();
						} else {
							util.emsg(dat);
						}
					});
				}
			};
			
			util.checkUploadSize(this, function (suc) {
				if (suc) {
					next();
				}
			});
		});
		
		if (config.init) {
			selected = config.init;
			showPreview(true);
		}

		main.find(".exit-btn, .exdim").click(function () {
			main.modal("hide");
			if (cb) cb(null, getArg());
		});

		main.modal({
			allowMultiple: true,
			observeChanges: true,
			autofocus: false,
			
			onHide: function () {
				if (hide_locked) return false;
			}
		});

		main.modal("show");
	}

	return {
		init: init,
		field: field
	};
});
