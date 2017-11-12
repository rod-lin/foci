/* comment */

"use strict";

define([
	"com/util", "com/login", "com/rating",
	"com/avatar", "com/xfilt", "com/lang",
	"com/env", "com/tip"
], function (util, login, rating, avatar, xfilt, lang, env, tip) {
	foci.loadCSS("com/comment.css");

	function init(cont, euid, config) {
		cont = $(cont);
		config = $.extend({
			state: 2,
			disable_prompt: "rating disabled"
		}, config);

		var main = $(" \
			<div class='com-comment'> \
				<div class='new-comment'> \
					<textarea class='content input-no-style'></textarea> \
					<div class='toolbar'> \
						<div class='rating-cont'><span class='prompt'>Rate it</span></div> \
						<button class='ui blue right floated button issue-btn'>Issue</button> \
					</div> \
				</div> \
				<div class='block-prompt'>Hot comments</div> \
				<div class='hot-comment'></div> \
				<div class='block-prompt'>Other comments</div> \
				<div class='history'></div> \
				<div class='loader-cont'> \
					<div class='ui loader active'></div> \
				</div> \
			</div> \
		");

		var nrating = rating.init(main.find(".new-comment .rating-cont"), 0, { freeze: false });
		var history = main.find(".history");
		var hot = main.find(".hot-comment");

		function genPrompt(msg) {
			return $("<div class='prompt'></div>").html(msg);
		}

		function genComment(info) {
			var comm = $(" \
				<div class='comment comment-id-" + info.id + "'> \
					<div class='sender'> \
						<div class='avatar'></div> \
						<div class='info'> \
							<div class='name-bar'><span class='name'>loading</span><span class='comm-date'></span></div> \
							<div class='ev-rating'></div> \
						</div> \
						<div class='btnlet'> \
							<div class='upvote-btn'> \
								<i class='thumbs outline up fitted icon'></i> \
								<div class='count'></div> \
							</div> \
						</div> \
					</div> \
					<div class='cont'></div> \
				</div> \
			");

			if (info.rating)
				rating.init(comm.find(".ev-rating"), info.rating);
			else
				comm.find(".ev-rating").addClass("no-rating").html("no rating");

			comm.find(".comm-date").html(util.localDate(new Date(info.date)));

			var vote_count = info.upvote ? info.upvote.length : 0;
			var has_voted = false;

			function setVoted() {
				has_voted = true;
				comm.find(".upvote-btn i").removeClass("outline");
				comm.find(".upvote-btn").transition("tada");
			}

			function unsetVoted() {
				has_voted = false;
				comm.find(".upvote-btn i").addClass("outline");
				comm.find(".upvote-btn").transition("pulse");
			}

			if (env.session())
				if (info.upvote && info.upvote.indexOf(env.session().getUUID()) != -1) {
					setVoted();
				}

			comm.on("comment:remupvote", function () {
				unsetVoted();
				vote_count--;
				comm.find(".count").html(vote_count);
			});

			comm.on("comment:upvote", function () {
				setVoted();
				vote_count++;
				comm.find(".count").html(vote_count);
			});

			comm.find(".count").html(vote_count);
			comm.find(".cont").html(xfilt(lang.msg(info.comment || "$core.comment.empty")));
			comm.find(".upvote-btn").click(function () {
				login.session(function (session) {
					foci.encop(session, {
						int: "comment",
						action: has_voted ? "remupvote" : "upvote",
						euid: euid,
						cid: info.id
					}, function (suc, dat) {
						if (suc) {
							if (has_voted) {
								main.find(".comment-id-" + info.id).trigger("comment:remupvote");
							} else {
								main.find(".comment-id-" + info.id).trigger("comment:upvote");
							}
						} else {
							util.emsg(dat);
						}
					});
				});
			});

			if (info.uuid) {
				util.userInfo(info.uuid, function (dat) {
					comm.find(".name").html(dat.dname);
					avatar.init(comm.find(".avatar"), dat, { radius: "5px", shadow: "0 0 1px rgba(0, 0, 0, 0.3)" });
				});
			}

			return comm;
		}

		var cur_skip = 0;
		var is_end = false;
		var locked = false;

		function renderComment(list, cont, no_more_prompt) {
			if (list.length) {
				for (var i = list.length - 1; i >= 0; i--) {
					cont.append(genComment(list[i]));
				}
			} else {
				cont.append(genPrompt(no_more_prompt || "no more comments"));
				is_end = true;
			}

			cur_skip += list.length;
		}

		function reloadComment() {
			cur_skip = 0;
			is_end = false;
			history.html("");
			loadMore();
		}

		function loadMore() {
			if (is_end) return;
			if (locked) return;
			locked = true;

			history.addClass("loading");
			history.children(".prompt").remove();

			foci.get("/event/comment", { euid: euid, skip: cur_skip }, function (suc, dat) {
				history.removeClass("loading");

				if (suc) {
					renderComment(dat, history);
				} else {
					history.append(genPrompt("loading error"));
					util.emsg(dat);
				}

				locked = false;
			});
		}

		function reloadHot() {
			hot.html("");
			hot.addClass("loading");

			foci.get("/event/comment", { euid: euid, hot: true }, function (suc, dat) {
				hot.removeClass("loading");

				if (suc) {
					renderComment(dat, hot, "no hot comment");
				} else {
					hot.append(genPrompt("loading error"));
					util.emsg(dat);
				}

				locked = false;
			});
		}

		function issueComment() {
			var newcomm = main.find(".new-comment");

			var cont = newcomm.find(".content").val();
			var rating = nrating.get();

			login.session(function (session) {
				foci.encop(session, {
					int: "comment",
					action: "issue",

					euid: euid,
					rating: rating,
					comment: cont
				}, function (suc, dat) {
					if (suc) {
						util.emsg("comment issued", "success");
						newcomm.find(".content").val("");
						nrating.set(0);

						reloadComment();
						reloadHot();
					} else {
						util.emsg(dat);
					}
				});
			});
		}

		// event state
		if (config.state < 2) {
			main.find(".rating-cont").addClass("disabled");
			tip.init(main.find(".rating-cont"), config.disable_prompt, "bottom center", { on: "hover", auto: false });
		}

		main.find(".issue-btn").click(issueComment);

		reloadComment();
		reloadHot();

		cont.append(main);

		var ret = {};

		ret.more = function () {
			loadMore();
		};

		return ret;
	}

	return { init: init };
});
