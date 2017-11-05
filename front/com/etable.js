"use strict";

define([ "com/util" ], function (util) {
    var $ = jQuery;

    var etable = {};

    var delbtn = $('<td class="center aligned"><button type="button" class="ui frameless icon button" style="margin-right: 0;"><i class="cancel icon"></i></button></td>');

    function initDataRow(dom, table) {
        var del = delbtn.clone();

        dom = $(dom);
        dom.append(del);
        
        del.find(".button").click(function () {
            dom.remove();
            table.trigger("etable:change");
        });
    }

    etable.editable = function (table, config) {
        table = $(table);
        config = $.extend({
            check: [],

            // onChange
            // onAdd
        }, config);

        var headers = [];

        var addbtn = $('<td class="center aligned"><button type="button" class="ui frameless icon button" style="margin-right: 0;"><i class="check icon"></i></button></td>');

        var tbody = table.find("tbody");

        table.find("thead tr th").each(function (i, dom) {
            headers.push($(dom).html());
        });

        // option column
        table.find("thead tr").append("<th></th>");

        var newentry = $("<tr class='newentry'></tr>");

        for (var i = 0; i < headers.length; i++) {
            var td = $("<td><input class='input-no-" + i + "'></td>");
            newentry.append(td);

            (function (td) {
                td.find("input").keydown(function () {
                    td.removeClass("error");
                });
            })(td);
        }

        newentry.append(addbtn);

        tbody.find("tr").each(function (i, dom) {
            initDataRow(dom, table);
        });
    
        tbody.append(newentry);
    
        addbtn.find(".button").click(function () {
            var newrow = $("<tr></tr>");
            var fail = false;

            var values = [];

            for (var i = 0; i < headers.length; i++) {
                var input = tbody.find(".input-no-" + i);
                var value = input.val();

                values.push(value);

                if (config.check[i] && config.check[i].reg) {
                    if (!config.check[i].reg.test(value)) {
                        input.parent().addClass("error");
                        util.emsg(config.check[i].prompt || "illegal value");
                        fail = true;
                    }
                }

                newrow.append("<td>" + value + "</td>");
            }

            if (fail) return;

            initDataRow(newrow, table);
            // tbody.append(newrow);
            newentry.before(newrow);

            if (config.onAdd) {
                config.onAdd(values);
            }

            if (config.onChange) {
                config.onChange();
            }
        });

        if (config.onChange) {
            table.on("etable:change", config.onChange);
        }

        var mod = {};

        mod.getAll = function () {
            return etable.extract(table);
        };

        return mod;
    };

    // assuming the table has been initialized by etable.editable
    etable.extract = function (table) {
        var rows = table.find("tbody tr").not(".newentry");
        
        var ret = [];

        rows.each(function (i, dom) {
            var row = [];

            dom = $(dom);
            ret.push(row);

            var col = dom.find("td");

            col.each(function (i, dom) {
                if (i == col.length - 1) return; // skip the last column(button)
                row.push($(dom).html());
            });
        });

        return ret;
    };

    etable.refill = function (table, rows) {
        table.find("tbody tr").not(".newentry").remove();

        for (var i = 0; i < rows.length; i++) {
            var newrow = $("<tr></tr>");

            for (var j = 0; j < rows[i].length; j++) {
                newrow.append("<td>" + rows[i][j] + "</td>");
            }

            initDataRow(newrow, table);            
            table.find(".newentry").before(newrow);
        }

        table.trigger("etable:change");
    };

    return etable;
});
