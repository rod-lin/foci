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

	function genForm(obj) {
		// input {
		//     type, name, [ placeholder, value, label ]
		// }
		function genInput(input) {
			var ret;

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
					ret = "<div class='ui checkbox'><input class='hidden' type='checkbox'>";
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

		cont.append(gen);
	
		var ret = {};

		return ret;
	}

	function modal(form, config) {
		config = $.extend({

		}, config);

		var main = $(" \
			<div class='com-form ui small modal'> \
				<div class='title'></div> \
				<div class='form'></div> \
				<div style='text-align: center; margin-top: 3rem;'> \
					<div class='ui green button'>save</div> \
					<div class='ui primary button'>submit</div> \
				</div> \
			</div> \
		");

		initForm(main.find(".form"), form, config);

		main.find(".title").html(form.name || "(untitled)");

		main.modal("show");

		var ret = {};

		return ret;
	}

	return {
		modal: modal
	};
});
