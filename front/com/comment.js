/* comment */

"use strict";

define([
	"com/util", "com/login", "com/rating",
	"com/avatar", "com/xfilt", "com/lang",
	"com/env"
], function (util, login, rating, avatar, xfilt, lang, env) {
	foci.loadCSS("com/comment.css");

	function init(cont, euid, config) {
		cont = $(cont);
		config = $.extend({}, config);

		var main = $(" \
			<div class='com-comment'> \
				<div class='new-comment'> \
					<textarea class='content input-no-style'></textarea> \
					<div class='toolbar'> \
						<div class='rating-cont'><span class='prompt'>Rate it</span></div> \
						<button class='ui blue right floated button issue-btn'>Issue</button> \
					</div> \
				</div> \
				<div class='history'></div> \
				<div class='loader-cont'> \
					<div class='ui loader active'></div> \
				</div> \
			</div> \
		");

		var nrating = rating.init(main.find(".new-comment .rating-cont"), 0, { freeze: false });
		var history = main.find(".history");

		function genPrompt(msg) {
			return $("<div class='prompt'></div>").html(msg);
		}

		function genComment(info) {
			var comm = $(" \
				<div class='comment'> \
					<div class='sender'> \
						<div class='avatar'></div> \
						<div class='info'> \
							<div class='name'>loading</div> \
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

			rating.init(comm.find(".ev-rating"), info.rating || 0);
			var ava = avatar.init(comm.find(".avatar"), {}, { radius: "5px", shadow: "0 0 1px rgba(0, 0, 0, 0.3)" });

			var voted = info.upvote ? info.upvote.length : 0;

			function setVoted() {
				comm.find(".upvote-btn i").removeClass("outline");
			}

			if (env.session())
				if (info.upvote && info.upvote.indexOf(env.session().getUUID()) != -1)
					setVoted();

			comm.find(".count").html(voted);
			comm.find(".cont").html(xfilt(lang.msg(info.comment || "$core.comment.empty")));
			comm.find(".upvote-btn").click(function () {
				login.session(function (session) {
					foci.encop(session, {
						int: "comment",
						action: "upvote",
						euid: euid,
						cid: info.id
					}, function (suc, dat) {
						if (suc) {
							voted++;
							comm.find(".count").html(voted);
							setVoted();
						} else {
							util.emsg(dat);
						}
					});
				});
			});

			if (info.uuid) {
				foci.get("/user/info", { uuid: info.uuid }, function (suc, dat) {
					if (suc) {
						comm.find(".name").html(dat.dname);
						ava.setAvatar(foci.download(dat.avatar));
					} else {
						util.emsg(dat);
					}
				});
			}

			return comm;
		}

		var cur_skip = 0;
		var is_end = false;
		var locked = false;

		function renderComment(list) {
			if (list.length) {
				for (var i = list.length - 1; i >= 0; i--) {
					history.append(genComment(list[i]));
				}
			} else {
				history.append(genPrompt("no more comments"));
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
					renderComment(dat);
				} else {
					history.append(genPrompt("loading error"));
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
					} else {
						util.emsg(dat);
					}
				});
			});
		}

		main.find(".issue-btn").click(issueComment);

		reloadComment();

		cont.append(main);

		var ret = {};

		ret.more = function () {
			loadMore();
		};

		return ret;
	}

	return { init: init };
});
