"use strict";

var err = require("./err");
var util = require("./util");
var file = require("./file");
var config = require("./config");

var fs = require("fs");
var uglifyjs = require("uglify-js2");

// replace 'define(' with 'define("com/[com-name]", '
var parseFile = async (cont, name) => {
    cont = cont.replace("define(", "define(\"com/" + name + "\", ");
    
    var cssreg = /foci\.loadCSS\(['"]([^'"]*)['"]\);?/g;
    var files = [];

    cont.replace(cssreg, function (stmt) {
        var match = stmt.match(/foci\.loadCSS\(['"]([^'"]*)['"]\);?/);
        files.push("front/" + match[1]);
        return stmt;
    });

    for (var i = 0; i < files.length; i++) {
        files[i] = await file.readFileAsync(files[i]);
    }

    var i = 0;

    cont = cont.replace(cssreg, function (match) {
        return "foci.loadCSSPlain(" + JSON.stringify(files[i++].toString()) + ")";
    });

    return ";(function () { " + cont + "})();";
};

var cache = {
    // query: { ctime, batch }
};

// return { modified, batch }
exports.merge = async (coms) => {
    var query = Array.from(new Set(coms)).sort().join(",");

    if (cache[query]) {
        var entry = cache[query];

        if (entry.ctime + config.mcom.expire > new Date()) {
            delete cache[query];
        } else {
            return { batch: entry.batch, modified: entry.ctime };
        }
    }

    var batch = "";

    for (var i = 0; i < coms.length; i++) {
        if (!/[a-zA-Z0-9]+/.test(coms)) {
            throw new err.Error("$core.illegal_com_name");
        } else {
            batch += await parseFile((await file.readFileAsync("front/com/" + coms[i] + ".js")).toString(), coms[i]);
        }
    }

    batch = uglifyjs.minify(batch, {
        fromString: true
    }).code;

    cache[query] = {
        ctime: new Date(),
        batch: batch
    };

    return { batch: batch, modified: undefined };
};
