/* value field - general form filing & restore */

"use strict";

define([ "com/util", "com/etable" ], function (util, etable) {
    var $ = jQuery;

    var valfield = {};

    /**
     * format for a valfield form
     * add 'value-field' class to the input/table/textarea/radio
     * set 'data-field-type' if required(default in text)
     * set 'name'(unique)
     */

    // return an object with name-value mappings
    valfield.extract = function (form, config) {
        form = $(form);
        config = $.extend({}, config);

        var ret = {};

        form.find(".value-field").each(function (i, dom) {
            dom = $(dom);

            var name = dom.attr("name");
            var val;

            if (ret.hasOwnProperty(name)) return;

            switch (dom.data("field-type")) {
                case "radio":
                case "check":
                    var group = form.find("[name='" + name + "']");
                    val = [];

                    group.each(function (i, dom) {
                        val.push($(dom).checkbox("is checked") ? 1 : 0);
                    });

                    break;

                case "etable":
                    val = etable.extract(dom);
                    break;

                default: // text
                    val = dom.val();
            }

            ret[name] = val;
        });

        return ret;
    };

    valfield.refill = function (form, data, config) {
        form = $(form);
        config = $.extend({}, config);

        for (var name in data) {
            if (data.hasOwnProperty(name)) {
                var val = data[name];
                var field = form.find("[name='" + name + "']");
                
                switch (field.data("field-type")) {
                    case "radio":
                    case "check":
                        var group = field;

                        group.each(function (i, dom) {
                            if (val[i]) {
                                $(dom).checkbox("check");
                            } else {
                                $(dom).checkbox("uncheck");
                            }
                        });

                        break;

                    case "etable":
                        etable.refill(field, val);
                        break;

                    default:
                        field.val(val);
                }
            }
        }
    };

    return valfield;
});
