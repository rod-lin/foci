/* server status */

"use strict";

var err = require("./err");
var util = require("./util");
var config = require("./config");

// map ip -> { page1: count, page2: count }
var traffic_map = {};
var control_log = [];
var ip_count = 0;

var conf = config.lim.traffic;
var cur_level = conf.default_level;

var curConf = () => conf.levels[cur_level];

// (not quite) garbage ip collection
var collectTraffic = () => {
    var now = new Date();
    var level = curConf();
    
    for (var k in traffic_map) {
        if (traffic_map.hasOwnProperty(k)) {
            if (now - traffic_map[k]["$last"] > level.gc_time_threshold)
                delete traffic_map[k];
        }
    }
};

var controlLog = prompt => {
    control_log.push(prompt);
    util.log(prompt, util.style.yellow("TRAFFIC CONTROL"));
};

// general tests, returning false for captcha, true for no captcha
exports.testTraffic = ip => {
    var rec = traffic_map[ip];
    
    if (!rec) return true;
    
    var now = new Date();
    // console.log(now, rec["$last"], rec["$total"]);
    
    // if a single ip requested more than curConf().max_count_per_int_per_ip_per_gc
    // times during two gc periods, trigger a captcha
    if (now - rec["$last"] < curConf().gc_time_threshold &&
        rec["$total"] > curConf().max_count_per_int_per_ip_per_gc) {
        controlLog("ip " + ip + " triggered a captcha check");
        // delete traffic_map[ip];
        return false;
    }
    
    return true;
};

exports.clearTrafficFor = ip => {
    delete traffic_map[ip];
};

exports.logRequest = (ip, page) => {
    // console.log(ip, page);
    
    if (!traffic_map.hasOwnProperty(ip)) {
        if (ip_count >= curConf().gc_threshold) {
            collectTraffic();
        }
        
        traffic_map[ip] = { "$total": 0, "$first": new Date() };
        ip_count++;
    }
    
    if (!traffic_map[ip].hasOwnProperty(page)) {
        traffic_map[ip][page] = 1;
    } else {
        traffic_map[ip][page]++;
    }
    
    traffic_map[ip]["$last"] = new Date(); // last record
    traffic_map[ip]["$total"]++; // total number of requests
};

exports.getTraffic = () => traffic_map;
exports.getLog = () => control_log;

setInterval(collectTraffic, curConf().gc_time_threshold);
