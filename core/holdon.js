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

var bctok = encop => "holdon.broadcast" + (encop ? ".encop" : "");
var enctok = uuid => "holdon.encop." + uuid;

var bc_count = 0;

// channel connect number
var chan_conn = {};

// last_date: last time a holdon is closed
exports.listen = async (chan, max_conn, next, last_date) => {
	if (!chan_conn.hasOwnProperty(chan))
		chan_conn[chan] = 0;

	if (++chan_conn[chan] >= max_conn) {
		throw new err.Exc("$core.holdon.max_conn_reached");
	}

	var missed = []; // missed messages

	// init & get channel buffer
	chanbuf(chan).each(function (msg) {
		if (msg.ctime > last_date) {
			// the message is sent after closing the holdon call
			missed.push(msg);
		}
	});

	if (missed.length) {
		// send missed message first
		next(missed);
		chan_conn[chan]--;
	} else {
		var timeout = setTimeout(function () {
			tick.awrap(lpoll.emit)(chan, null);
		}, config.lpoll.timeout);

		lpoll.reg(chan, async (msg) => {
			chan_conn[chan]--;
			clearTimeout(timeout);
			next(msg === null ? null : [ msg ]); // one message a time
		});
	}
};

exports.listenBroadcast = async (next, last_date) =>
	await exports.listen(bctok(), config.lim.holdon.max_broadcast_conn, next, last_date);

exports.listenEncop = async (uuid, next, last_date) =>
	await exports.listen(enctok(uuid), config.lim.holdon.max_encop_conn, next, last_date);

exports.chan = {
	broadcast: bctok,
	encop: enctok
};

exports.send = async (channel, msg) => {
	chanbuf(channel).push(msg);
	await lpoll.emit(channel, msg);
};
