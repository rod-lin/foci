define(function () {
	// error string:
	//     "$lack_field(id, $help_page). Now go!"
	// 
	// def:
	//     "help_page": "'Help' page"
	//     "lack_field": "Field missing: $1. Go to $2 for more help"
	// 
	// expand:
	//     "Field missing: id. Go to 'Help' page for more help. Now go!"
	// 
	// Syntax:
	//     Given a definition(no substitution in definitions):
	//     {
	//         name: "Rod",
	//         age: "100",
	//         phone: "110",
	//         call: "call $1 with phone number $2"
	//     }
	// 
	//     1. Simple substitue
	//         e.g.
	//             $name -> Rod
	//             $age -> 100
	//             $call -> call $1 with phone number $2
	//             
	//     2. Substitution with arguments
	//         e.g.
	//             $call(Rod,110) -> call Rod with phone number 110
	//             $call($name, $phone) -> call Rod with phone number 110
	//             
	function expand(msg, def, em) {
		var reg_id = /\$([a-zA-Z_.][a-zA-Z0-9_.]*)/g;
		var reg_num = /\$([1-9][0-9]*)/g;

		var res;
		var beg = 0;

		var ret = "";

		def = def || {};
		var err = function (msg) {
			msg = "expand error: " + msg + "(in message '" + msg + "')";

			if (em) em(msg);
			else console.log(msg);
		};

		while (res = reg_id.exec(msg)) {
			var i = res.index + res[0].length;

			// console.log(res);

			if (i == msg.length || msg[i] != "(") {
				if (def.hasOwnProperty(res[1])) {
					ret += msg.substring(beg, res.index) + expand(def[res[1]], def, em);
					beg = i;
				} else {
					err("cannot find id '" + res[1] + "' in the definitions");
					// TODO: error
				}
			} else {
				// msg[i] == "("
				i++;

				var lone = 1;
				var arg = [];
				var argi = i;

				for (; i < msg.length && lone; i++) {
					switch (msg[i]) {
						case "(": lone++; break;
						case ")":
							lone--;

							if (!lone) {
								arg.push(msg.substring(argi, i));
								argi = i + 1;
							}

							break;
						
						case ",":
							if (lone == 1) { // at the outermost layer
								arg.push(msg.substring(argi, i));
								argi = i + 1;
							}

							break;
					}
				}

				// console.log(arg);

				if (lone) {
					err("unpaired parenthesis");
				} else {
					if (def.hasOwnProperty(res[1])) {
						for (var j = 0; j < arg.length; j++) {
							arg[j] = expand(arg[j], def, em);
							// alert(arg[j]);
						}

						var prompt = def[res[1]];
						var subt = "";

						if (typeof prompt === "function") {
							subt = expand(prompt.apply(undefined, arg), def, em);
						} else {
							var num, nres;
							var subi = 0;

							while (nres = reg_num.exec(prompt)) {
								num = parseInt(nres[1]) - 1;
								if (num < arg.length) {
									subt += prompt.substring(subi, nres.index) + arg[num];
									subi = nres.index + nres[0].length;
								} else {
									err("failed to subtitute $" + (num + 1) + ": too less arguments(definition '" + prompt + "')");
								}
							}

							subt += prompt.substring(subi);
							subt = expand(subt, def, em);
						}

						ret += msg.substring(beg, res.index) + subt;
						beg = i;
					} else {
						err("cannot find id '" + res[1] + "'' in the definitions");
					}
				}
			}

			reg_id.lastIndex = i;
		}

		ret += msg.substring(beg);

		return ret;
	}

	var dict = {
		"def.network.network_error": "network error with status $1",
		"def.network.file_too_large": "file too large",
		"def.server_error": "server_error",
		"def.no_session": "no session stored",
		"def.no_login": "you haven't logged in",
		"def.failed_parse_form": "failed to parse form",
		"def.illegal_json": "illegal JSON format",
		"def.missing_n_field": "missing $1 field(s)",
		"def.register_suc": "success, automatically login now",
		"def.uninit_recaptcha": "unintialized reCaptcha handler",
		"def.fail_show_captcha": "failed to show captcha(try refreshing the page)",
		"def.request_cancelled": "request cancelled",
		
		"nat.all_cap": function (str) {
			return str.toUpperCase();
		},

		"nat.cap": function (str) {
			return str[0].toUpperCase() + str.substring(1);
		}
	};

	function msg(msg) {
		return expand(msg, dict);
	}

	// load dictionary
	function loadDict(name, util, cb) {
		util = util || { emsg: function (msg) { console.log(msg); } };

		foci.get("/dict", { lang: name }, function (suc, dat) {
			if (suc) {
				$.extend(dict, dat);
				var tmp = util.mfilt;
				util.mfilt = function (str) { return tmp(msg(str)); };
			} else {
				util.emsg(msg("$front.com.lang.fail_load_dict(" + name + "): " + dat));
			}

			if (cb) cb(suc);
		});
	}

	function update(query) {
		var dom = $(query).find(".lang");

		dom.each(function (n, el) {
			el = $(el);
			var replace = el.attr("data-replace");
			var attr = el.attr("data-attr");

			if (replace) {
				var suc = true;
				var res = expand(replace, dict, function (err) {
					console.log(err);
					console.log("replace canceled");
					suc = false;
				});

				if (suc) {
					if (attr) {
						el.attr(attr, res);
					} else el.html(res);
				}
			}
		});
	}

	function inline(replace, cont) {
		var ret = $("<span class='lang'></span>").attr("data-replace", replace).html(cont);
		update(ret);
		return ret;
	}

	return {
		msg: msg,
		loadDict: loadDict,
		expand: expand,
		update: update,
		inline: inline
	};
});
