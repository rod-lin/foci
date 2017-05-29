/* a form generator */

"use strict";

/*

JSON -> form with semantic-ui classes

{
	"name": "Staff Form",
	"block": [
		{
			[

			]

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

define([ "com/util" ], function (util) {
	var $ = jQuery;

	foci.loadCSS("com/formi.css");

	function warn(msg) {
		console.log("formi: " + msg);
	}

	function genForm(obj) {
		// input {
		//     type, name, [ placeholder, value, label ]
		// }
	
		obj = obj || { block: [] };

		var fields = {};

		function genInput(input) {
			var ret;

			input.type = input.type || "text";
			
			if (!input.name) {
				warn("unnamed input");
				input.name = "unnamed";
			} else {
				if (fields.hasOwnProperty(input.name)) {
					warn("duplicated name '" + input.name + "'");
				} else {
					fields[input.name] = { opt: !!input.opt, type: input.type };
				}
			}

			if (input.type == "check" && !input.label) {
				warn("checkbox with no label");
				input.label = "unlabeled";
			}

			switch (input.type) {
				case "textarea":
				case "text":
					ret = "<" + (input.type == "textarea" ? "textarea" : "input") + " name='" + input.name + "'";

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
					ret = "<div class='ui checkbox'><input class='hidden' type='checkbox' name='" + input.name + "'>";
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
		function genField(field) {
			var ret;

			if (field instanceof Array) {
				ret = "<div class='fields'>";

				for (var i = 0; i < field.length; i++) {
					ret += genField(field[i]);
				}

				ret += "</div>";
			} else {
				ret = "<div class='field'>";

				if (field.name) {
					ret += "<label>" + field.name + "</label>";
				}

				if (field.sub) {
					ret += "<div class='fields'>";
				
					for (var i = 0; i < field.sub.length; i++) {
						ret += genField(field.sub[i]);
					}

					ret += "</div>";
				} else if (field.input) {
					ret += genInput(field.input);
				}

				ret += "</div>";
			}

			return ret;
		}

		// a block has to an object
		// block: {
		//     name, field
		// }
		function genBlock(block) {
			var ret = "<h3 class='ui dividing header'>" + block.name + "</h4>"
	
			for (var i = 0; i < block.field.length; i++) {
				ret += genField(block.field[i]);
			}

			return ret;
		}

		if (!obj.block) return null;

		var ret = "<form class='ui form'>";

		for (var i = 0; i < obj.block.length; i++) {
			ret += genBlock(obj.block[i]);
		}

		ret += "</form>";

		ret = $(ret);
	
		ret.find(".checkbox").checkbox();

		return {
			dom: ret,
			fields: fields
		};
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
						res.dat[k] = value;
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
					ival(ret.fields[k], fields[k]);
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
			uid: "no_uid"
		}, config);

		var main = $(" \
			<div class='com-form ui small modal'> \
				<div class='title'></div> \
				<div class='form'></div> \
				<div style='text-align: center; margin-top: 3rem;'> \
					<div class='ui buttons'> \
						<div class='ui white button restore' data-content='Click to restore the form'>restore</div> \
						<div class='ui blue button save'>save</div> \
						<div class='ui green button submit'>submit</div> \
					</div> \
				</div> \
			</div> \
		");

		var gen = initForm(main.find(".form"), form, config);

		main.find(".title").html(form.name || "(untitled)");

		main.find(".save").click(function () {
			main.find(".restore").popup("hide");
			gen.save(config.uid);
			util.emsg("saved", "info");
		});

		main.find(".restore").click(function () {
			main.find(".restore").popup("hide");
			gen.restore(config.uid);
		});

		var submitted = false;

		main.find(".submit").click(function () {
			var res = gen.check();
			var next = function (suc) {
				main.find(".submit").removeClass("loading");
			
				if (suc) {
					main.modal("hide");
				}
			};

			main.find(".submit").addClass("loading");

			if (res.suc) {
				submitted = true;
				if (config.submit) config.submit(res.dat, next);
				else next(true);
			}
		});

		if (gen.hasSave(config.uid)) {
			setTimeout(function () {
				main.find(".restore").popup({ on: "manual" }).popup("show");
				setTimeout(function () {
					main.find(".restore").popup("hide");
				}, 8000);
			}, 1000);
		}

		main.modal({
			onHide: function () {
				main.find(".restore").popup("hide");
				if (!submitted) {
					main.find(".save").click();
					if (config.cancel) config.cancel();
				}
			}
		});
		main.modal("show");

		var ret = {};

		return ret;
	}

	return {
		genForm: genForm,
		modal: modal
	};
});
