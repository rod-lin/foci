/* long pull updating mech */

"use strict";

var err = require("./err");
var util = require("./util");
var tick = require("./tick");
var lpoll = require("./lpoll");
var config = require("./config");

// two kinds of holdon channel
// 1. broadcast(bc): no need to login, general notice
// 2. encop: need to login, specific notice

/**
 * holdon message // message sent back to channels
 *     module: string // type of message(notice, chat, gnotice(general notice))
 *     data: any // message data, any js object
 *     
 */
var HoldonMessage = function (module, data) {
	this.module = module;
	this.data = data;
	this.ctime = new Date();
};

exports.HoldonMessage = HoldonMessage;

// message buffer: used to send missed message for client
var msg_buf = {};

function chanbuf(chan) {
	if (!msg_buf.hasOwnProperty(chan))
		msg_buf[chan] = new util.CircBuffer(config.lim.holdon.msg_buf_len);
	
	return msg_buf[chan];
}

var bctok = () => "holdon.broadcast";
var bc_count = 0;

// last_date: last time a holdon is closed
exports.listenBroadcast = async (next, last_date) => {
	if (bc_count >= config.lim.holdon.max_broadcast) {
		throw new err.Exc("$core.holdon.max_broadcast_reached");
	}

	var missed = []; // missed messages

	// init & get channel buffer
	chanbuf(bctok()).each(function (msg) {
		if (msg.ctime > last_date) {
			// the message is sent after closing the holdon call
			missed.push(msg);
		}
	});

	if (missed.length) {
		// send missed message first
		next(missed);
	} else {
		var timeout = setTimeout(function () {
			tick.awrap(lpoll.emit)(bctok(), null);
		}, config.lpoll.timeout);

		lpoll.reg(bctok(), async (msg) => {
			bc_count--;
			clearTimeout(timeout);
			next(msg === null ? null : [ msg ]); // one message a time
		});
		
		bc_count++;
	}
};

exports.chan = {
	broadcast: bctok
};

exports.send = async (channel, msg) => {
	chanbuf(channel).push(msg);
	await lpoll.emit(channel, msg);
};
