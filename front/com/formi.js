/* a form generator */

"use strict";

/*

JSON -> form with semantic-ui classes

{
	"name": "Staff Form",
	"block": [
		{
			{
				"name": "Name",
				"sub": [
					{
						type: "text",
						id: "first name",
						placeholder: "First name"
					},

					{
						type: "text",
						id: "last name",
						placeholder: "Last name"
					}
				]
			},

			{
				"name": ""
			}
		}
	]
}

 */

define([ "com/util", "com/editable", "com/xfilt", "com/popselect" ], function (util, editable, xfilt, popselect) {
	var $ = jQuery;

	foci.loadCSS("com/formi.css");

	function warn(msg) {
		console.log("formi: " + msg);
	}

	function genInput(name, input, colfields) {
		var ret;

		input.type = input.type || "text";

		if (!input.name) {
			warn("unnamed input");
			input.name = "unnamed";
		} else if (colfields) {
			if (colfields.hasOwnProperty(input.name)) {
				warn("duplicated name '" + input.name + "'");
			} else {
				colfields[input.name] = { opt: !!input.opt, type: input.type, name: name };
			}
		}

		if (input.type == "check" && !input.label) {
			warn("checkbox with no label");
			input.label = "unlabeled";
		}

		switch (input.type) {
			case "textarea":
			case "text":
				if (input.type == "textarea") {
					ret = "<textarea class='textarea-input' name='" + input.name + "'";
				} else {
					ret = "<input class='text-input' name='" + input.name + "'";
				}

				if (input.placeholder) {
					ret += " placeholder='" + input.placeholder + "'";
				}

				if (input.value) {
					ret += " value='" + input.value + "'";
				}

				ret += ">";

				if (input.type == "textarea") {
					ret += "</textarea>";
				}

				break;

			case "check":
				ret = "<div class='ui checkbox check-input'><input class='hidden' type='checkbox' name='" + input.name + "'>";
				ret += "<label>" + (input.label || "") + "</label>";
				ret += "</div>";

				break;
		}

		return ret;
	}

	// a field can be an array or an object
	// [ field, field, ... ]
	// {
	//     name, [ sub or input ]
	// }
	function genField(field, single, colfields) {
		var ret, pref = "";

		if (field instanceof Array) {
			if (field.length > 0 && field.length <= 5) {
				pref = [ "one", "two", "three", "four", "five" ][field.length - 1];
			}

			ret = "<div class='" + pref + " fields'>";

			for (var i = 0; i < field.length; i++) {
				ret += genField(field[i], true, colfields);
			}

			ret += "</div>";
		} else {
			ret = (single ? "" : "<div class='one fields'>") + "<div class='field'>";

			if (field.name) {
				ret += "<label>" + field.name + "</label>";
			}

			if (field.input) {
				ret += genInput(field.name, field.input, colfields);
			}

			ret += "</div>" + (single ? "" : "</div>");
		}

		return ret;
	}

	// a block has to an object
	// block: {
	//     name, field
	// }
	function genBlock(block, colfields) {
		var ret = "<div class='block'><h3 class='ui header'>" + block.name + "</h4>"

		for (var i = 0; i < block.field.length; i++) {
			ret += genField(block.field[i], false, colfields);
		}

		return ret + "</div>";
	}

	function genForm(obj) {
		// input {
		//     type, name, [ placeholder, value, label ]
		// }

		obj = obj || { block: [] };

		var fields = {};

		if (!obj.block) return null;

		var ret = "<form class='ui form'>";

		for (var i = 0; i < obj.block.length; i++) {
			ret += genBlock(obj.block[i], fields);
		}

		ret += "</form>";

		ret = $(ret);

		ret.find(".checkbox").checkbox();

		return {
			dom: ret,
			fields: fields
		};
	}

	// parse JSON form from dom
	function parseForm(dom) {
		function parseInput(dom) {
			var input = $(dom.children()[1]);

			var ret = {
				name: input.attr("name"),
				placeholder: input.attr("placeholder")
			};

			if (input.hasClass("text-input")) {
				ret.type = "text";
			} else if (input.hasClass("textarea-input")) {
				ret.type = "textarea";
			} else if (input.hasClass("check-input")) {
				ret.type = "check";
				ret.label = input.children("label").text();
				ret.name = input.children("input").attr("name");
			} else ret.type = "text";

			return ret;
		}

		function parseField(dom) {
			var ret = [];

			var field = dom.children(".field").not(".no-save");

			field.each(function (n, el) {
				el = $(el);

				ret.push({
					name: el.children("label").text(),
					input: parseInput(el)
				});
			});

			return ret;
		}

		function parseBlock(dom) {
			var ret = {};

			ret.name = dom.children(".header").text();
			ret.field = [];

			var fields = dom.children(".fields");

			fields.each(function (n, el) {
				ret.field.push(parseField($(el)));
			});

			return ret;
		}

		var blocks = dom.find(".block");

		var ret = { block: [] };

		blocks.each(function (n, el) {
			ret.block.push(parseBlock($(el)));
		});

		return ret;
	}

	function initForm(cont, form, config) {
		cont = $(cont);
		config = $.extend({

		}, config);

		var gen = genForm(form);

		if (!gen) {
			util.emsg("$def.failed_parse_form");
			return;
		}

		cont.append(gen.dom);

		for (var k in gen.fields) {
			if (gen.fields.hasOwnProperty(k)) {
				gen.fields[k].dom = gen.dom.find("[name='" + k + "']");
			}
		}

		// sget input vale
		function ival(field, value) {
			if (value === undefined) {
				switch (field.type) {
					case "textarea":
					case "text":
						return field.dom.val();

					case "check":
						return field.dom.prop("checked");
				}
			} else {
				switch (field.type) {
					case "textarea":
					case "text":
						return field.dom.val(value);

					case "check":
						return field.dom.prop("checked", value);
				}
			}
		}

		var ret = {
			dom: gen.dom,
			fields: gen.fields
		};

		// check validity
		ret.check = function (quiet) {
			var res = { dat: {}, suc: true };
			var miss = 0;

			gen.dom.find(".error").removeClass("error");

			for (var k in ret.fields) {
				if (ret.fields.hasOwnProperty(k)) {
					var value = ival(ret.fields[k]);

					if (value == null || value === "") {
						if (!ret.fields[k].opt) {
							res.suc = false;
							miss++;

							if (!quiet) {
								ret.fields[k].dom.closest(".field").addClass("error");
							}
						}
					} else {
						res.dat[k] = { val: value, name: ret.fields[k].name };
					}
				}
			}

			if (miss && !quiet) {
				util.emsg("$def.missing_n_field(" + miss + ")");
			}

			return res;
		};

		ret.apply = function (fields) {
			for (var k in fields) {
				if (fields.hasOwnProperty(k) &&
					ret.fields.hasOwnProperty(k)) {
					ival(ret.fields[k], fields[k].val);
				}
			}
		};

		ret.save = function (name) {
			var cur = ret.check(true).dat;
			foci.setLocal("formi." + name, cur);
			return cur;
		};

		ret.restore = function (name) {
			var log = foci.getLocal("formi." + name);
			ret.apply(log);
		};

		ret.hasSave = function (name) {
			return !!foci.getLocal("formi." + name);
		};

		return ret;
	}

	function modal(form, config) {
		config = $.extend({
			uid: "no_uid",
			auto_save: true,
			leave_ask: true,
			preview: false,
			use_dragi: false
		}, config);

		var main = $(" \
			<div class='com-form ui small modal'> \
				<div class='title'></div> \
				<div class='form'></div> \
				<div class='btn-set' style='text-align: center; margin-top: 2rem;'> \
					<div class='ui buttons'> \
						<div class='ui white button cancel'>Cancel</div> \
						<div class='ui white button restore' data-content='Click to restore the form'>Restore</div> \
						<div class='ui blue button save'>Save</div> \
						<div class='ui green button submit'>Submit</div> \
					</div> \
				</div> \
			</div> \
		");

		var gen = initForm(main.find(".form"), form, config);

		if (config.preview) {
			main.find(".restore").addClass("disabled");
			main.find(".save").addClass("disabled");
			main.find(".submit").addClass("disabled");
		}

		main.find(".title").html(form.name || "(untitled)");

		main.find(".save").click(function () {
			main.find(".restore").popup("hide");
			gen.save(config.uid);
			util.emsg("form saved", "info");
		});

		main.find(".restore").click(function () {
			main.find(".restore").popup("hide");
			gen.restore(config.uid);
		});

		main.find(".cancel").click(function () {
			if (config.use_dragi)
				main.dragi("close");
			else
				main.modal("hide");
		});

		var submitted = false;

		main.find(".submit").click(function () {
			var res = gen.check();
			var next = function (suc) {
				main.find(".submit").removeClass("loading");

				if (suc) {
					can_hide = true;
					if (config.use_dragi)
						main.dragi("close");
					else
						main.modal("hide");
				}
			};

			if (res.suc) {
				main.find(".submit").addClass("loading");

				submitted = true;
				if (config.submit) config.submit(res.dat, next);
				else next(true);
			}
		});

		if (!config.preview && gen.hasSave(config.uid)) {
			setTimeout(function () {
				if (config.auto_save)
					main.find(".restore").popup({ on: "click" }).popup("show");

				setTimeout(function () {
					main.find(".restore").popup("hide");
				}, 8000);
			}, 1000);
		}

		var can_hide = false;

		function askCancel() {
			util.ask("Are you sure to cancel? Form content may be saved but the form(in edit mode) will not be saved", function (ans) {
				can_hide = ans;
				if (ans) main.modal("hide");
			});
		}

		var exited = false;

		if (config.use_dragi) {
			main.removeClass("ui small modal")
				.dragi({
					height: "auto",
					onClose: function () {
						if (!submitted) {
							if (config.auto_save)
								main.find(".save").click();
							if (config.cancel) config.cancel();
						}
					}
				})
				.dragi("enable resize")
				.dragi("title", form.name);
		} else {
			main.modal({
				onHide: function () {
					if (!can_hide && config.leave_ask) {
						askCancel();
						return false;
					}

					if (exited) return;
					exited = true;

					main.find(".restore").popup("hide");
					if (!submitted) {
						if (config.auto_save)
							main.find(".save").click();
						if (config.cancel) config.cancel();
					}
				}
			}).modal("show");
		}

		var ret = {};

		ret.openEdit = function (onSave) {
			var form = gen.dom;

			main.addClass("on-edit");

			var btnset = $(" \
				<div class='ui buttons'> \
					<div class='ui white button cancel-btn'>Cancel</div> \
					<div class='ui blue button preview-btn'>Preview</div> \
					<div class='ui green button save-btn'>Save</div> \
				</div> \
			");

			var split = $("<div class='ui divider'></div>");
			var addblock = $("<button class='ui basic button add-block-btn' type='button'><i class='add icon'></i>Add block</button>");
			var delbtn = $("<button class='ui icon button del-btn' type='button'><i class='cancel icon'></i></button>");

			var uid = 0;

			function nextUID() {
				while (form
						.find("input[name='input-" + uid + "']")
						.add("textarea[name='input-" + uid + "']").length != 0) uid++;
				return "input-" + uid;
			}

			main.find(".btn-set").html(btnset);

			btnset.find(".cancel-btn").click(function () {
				if (config.use_dragi)
					main.dragi("close");
				else
					main.modal("hide");
			});

			btnset.find(".preview-btn").click(function () {
				var nform = ret.genForm();

				can_hide = true;

				if (config.use_dragi)
					main.dragi("hide");
				else
					main.modal("hide");
					
				modal(nform, {
					cancel: function () {
						if (config.use_dragi)
							main.dragi("show");
						else
							main.modal("show");
							
						can_hide = false;
					},
					auto_save: false, leave_ask: false, preview: true
				});
			});

			btnset.find(".save-btn").click(function () {
				if (onSave)
					if (onSave(ret.genForm()) !== false) {
						can_hide = true;
						
						if (config.use_dragi)
							main.dragi("close");
						else
							main.modal("hide");
						
						form.find(".checkbox").checkbox("set enabled");
					}
			});

			var editable_conf = { explicit: true };

			function initField(field, group) {
				setTimeout(function () {
					field.append(delbtn.clone().css("height", field.find("label").outerHeight() + "px").click(function () {
						if (group.children(".field").not(".no-save").length == 1) {
							group.remove();
						} else {
							field.remove();
						}
					}));

					if (!config.use_dragi)
						main.modal("refresh");
				}, 100);
			}

			function askType(obj, cb) {
				popselect.init(obj, [
					{
						cont: "<i class='file text outline icon'></i> Text",
						onSelect: function () {
							cb("text");
						}
					},

					{
						cont: "<i class='align left icon'></i> Passage",
						onSelect: function () {
							cb("textarea");
						}
					},

					{
						cont: "<i class='checkmark box icon'></i> Checkbox",
						onSelect: function () {
							cb("check");
						}
					}
				]);
			}

			function initGroup(group, new_type) {
				// var split = $("<div class='ui divider'></div>");
				var addfield = $("<div class='field no-save'><label class='no-edit'>Add field</label><button class='ui basic icon button add-field-btn' type='button'><i class='add icon'></i></button></div>");

				group.append(addfield);
				// group.after(split);
				// editable.init(group.find(".field>label").not(".no-edit"), null, editable_conf);
				setEditable(group);
				group.find(".field").each(function (n, fl) {
					initField($(fl), group, split)
				});

				function setEditable(f) {
					f.ready(function () {
						f.find("label").not(".no-edit").each(function (i, dom) {
							// console.log(dom);
							editable.init($(dom), null, editable_conf);
						});

						initField(f, group);
					});
				}

				function newField(type) {
					if (group.find(".field").length >= 5) {
						util.emsg("unable to add more fields");
						return;
					}

					var f = $(genField({ name: "Field name", input: { type: type, name: nextUID() } }, true));
					addfield.before(f);

					setEditable(f);
					// f.find(".checkbox").checkbox();
				}

				askType(addfield.find("button"), newField);
			}

			function initBlock(block) {
				var addgroup = $("<button class='ui basic button add-group-btn' type='button'><i class='add icon'></i>Add group</button>");
				var header = block.children(".header");

				block.append(addgroup);
				editable.init(header, null, editable_conf);

				askType(addgroup, function (type) {
					var nfield = $(genField([ { name: "Field name", input: { type: type, name: nextUID() } } ]));
					addgroup.before(nfield);
					initGroup(nfield, type);
				});

				block.find(".fields").each(function (n, gr) {
					initGroup($(gr));
				});

				util.nextTick(function () {
					// console.log(header.length);
					// console.log(header[0]);

					block.append(delbtn.clone().css("height", header.outerHeight() + "px").click(function () {
						block.remove();
						header.remove();
					}));

					if (!config.use_dragi)
						main.modal("refresh");
				});
			}

			form.find(".checkbox").checkbox("set disabled").removeClass("disabled");

			form.append(split).append(addblock);
			editable.init(main.children(".title"), null, editable_conf);

			addblock.click(function () {
				split.before(genBlock({ name: "New block", field: [] }));
				initBlock(split.prev(".block"));
			});

			form.find(".block").each(function (n, bl) {
				bl = $(bl);
				initBlock(bl);
			});
		};

		ret.genForm = function () {
			var form = parseForm(gen.dom);
			form.name = main.children(".title").text();
			return form;
		};

		return ret;
	}

	return {
		genForm: genForm,
		modal: modal,
		parseForm: parseForm
	};
});
