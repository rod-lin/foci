/* mini com */

"use strict";

var err = require("./err");
var util = require("./util");
var file = require("./file");
var config = require("./config");

var fs = require("fs");
var uglifyjs = require("uglify-js2");
var minifycss = new (require("clean-css"))();
var minifyhtml = require("html-minifier").minify;

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
        var css = files[i++].toString();
        css = minifycss.minify(css).styles;
        return "foci.loadCSSPlain(" + JSON.stringify(css) + ")";
    });

    return ";(function () { " + cont + "})();";
};

var com_cache = {
    // query: { ctime, src }
};

var part_cache = {
    // part name: { ctime, src }
};

var css_cache = {

};

// proc(id): source
var ncache = async (cacheobj, id, proc) => {
    // check cache
    if (!config.mcom.no_cache && cacheobj[id]) {
        var entry = cacheobj[id];

        if (entry.ctime + config.mcom.expire > new Date()) {
            delete cacheobj[id];
        } else {
            return { src: entry.src, modified: entry.ctime };
        }
    }

    // process id if cache not found
    var src = await proc(id);

    // save cache
    if (!config.mcom.no_cache) {
        cacheobj[id] = {
            ctime: new Date(),
            src: src
        };
    }

    // return info
    return { src: src, modified: undefined };
};

exports.mpart = async (part) => {
    return await ncache(part_cache, part, async (part) => {
        var cont;
        
        if (!/^[a-zA-Z0-9\/]+$/.test(part)) {
            throw new err.Exc("$core.illegal_com_name");
        } else {
            cont = (await file.readFileAsync("front/sub/" + part + ".html")).toString();
        }
    
        return minifyhtml(cont, config.mcom.minify_html_conf);
    });
};

// return { modified, src }
exports.merge = async (coms) => {
    coms = Array.from(new Set(coms));
    var id = coms.sort().join(",");

    return await ncache(com_cache, id, async () => {
        var src = "";
        
        for (var i = 0; i < coms.length; i++) {
            if (!/^[a-zA-Z0-9\-\/]+$/.test(coms[i])) {
                throw new err.Exc("$core.illegal_com_name");
            } else {
                src += await parseFile((await file.readFileAsync("front/com/" + coms[i] + ".js")).toString(), coms[i]);
            }
        }
    
        src = uglifyjs.minify(src, {
            fromString: true
        }).code;

        return src;
    });
};

exports.mcss = async (files) => {
    files = Array.from(new Set(files));
    var id = files.sort().join(",");

    return await ncache(css_cache, id, async () => {
        var src = "";
        
        for (var i = 0; i < files.length; i++) {
            // console.log(files[i], /[a-zA-Z0-9\-\/]+/g.test(files[i]));
            if (!/^[a-zA-Z0-9\-\/]+$/.test(files[i])) {
                throw new err.Exc("$core.illegal_com_name");
            } else {
                if (files[i][0] != "/") files[i][0] = "/" + files[i][0];
                src += "\n" + (await file.readFileAsync("front" + files[i] + ".css")).toString();
            }
        }
    
        src = minifycss.minify(src).styles;

        return src;
    });
};

exports.mjs = async (files) => {
    files = Array.from(new Set(files));
    var id = files.sort().join(",");

    return await ncache(css_cache, id, async () => {
        var src = "";
        
        for (var i = 0; i < files.length; i++) {
            // console.log(files[i], /[a-zA-Z0-9\-\/]+/g.test(files[i]));
            if (!/^[a-zA-Z0-9\-\/]+$/.test(files[i])) {
                throw new err.Exc("$core.illegal_com_name");
            } else {
                if (files[i][0] != "/") files[i][0] = "/" + files[i][0];
                src += "\n" + (await file.readFileAsync("front" + files[i] + ".js")).toString();
            }
        }

        src = uglifyjs.minify(src, {
            fromString: true
        }).code;

        return src;
    });
};

exports.clearCache = () => {
    com_cache = {};
    css_cache = {};
    part_cache = {};
};

exports.disableCache = () => {
    exports.clearCache();
    config.mcom.no_cache = true;
    config.mcom.expire = 0;
};
