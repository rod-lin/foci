/* event bindings */

"use strict";

var tick = require("./tick");
var event = require("./event");
var notice = require("./notice");
var template = require("./template");

tick

.on("foci.event-apply", tick.awrap(async (euid, uuid, type) => {
	var ev = await event.euid(euid);

	var title = ev.title || "$core.notice.untitled";
	var job = {
		"partic": "participant",
		"staff": "staff"
	}[type];

	var tmp = await template.event_apply(title, job);

	await notice.push(uuid, euid, {
		type: "event",
		sender: euid,

		title: tmp.title,
		msg: tmp.msg
	});
}))

;
