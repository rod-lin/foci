/* language pack */

"use strict";

module.exports = {
	"english": {
		"impossible": "impossible: $1",
		"unsupported": "there is a vital component($1) not supported by your browser",

		"core.foci": "Foci",

		"core.word.rsakey": "RSA key",
		"core.word.title": "title",
		"core.word.descr": "description",
		"core.word.date": "date",
		"core.word.file_id": "file id",
		"core.word.file": "file",
		"core.word.search_keyword": "search keyword",
		"core.word.search_result": "search result",
		"core.word.app_form": "application form",

		"core.word.comment": "comment",
		"core.word.rating": "rating",

		"core.word.event": "event",
		"core.word.draft": "draft",

		"core.word.user": "user",
		"core.word.dname": "display name",
		"core.word.age": "age",
		"core.word.intro": "self introduction",
		"core.word.school": "school name",
		"core.word.tag": "tag",
		"core.word.sortby": "sort condition",

		"core.word.staff": "staff",
		"core.word.partic": "participant",
		"core.word.org": "organizer",

		"core.word.sid": "session id",
		"core.word.string": "string",

		"core.word.msg": "message",

		"core.internal_err": "internal error",
		"core.assert_failed": "assertion failed",

		"core.fail_upload": "fail to upload file",
		"core.too_long": "$1 too long",
		"core.illegal": "illegal $1",
		"core.illegal_expect_partic": "illegal expected participant number",
		"core.too_many": "too many $1s",
		"core.not_exist": "no such $1",
		"core.not_event_owner": "you're not the owner of this event",
		"core.not_event_applicant": "someone in the list is not an applicant",

		"core.illegal_app_type": "illegal type of application",
		"core.illegal_app_status": "illegal application status",
		"core.app_full": "application is full",
		"core.dup_app": "duplicated applications",
		"core.app_own_event": "you can't apply for your own event",

		"core.event_not_draft": "event not a draft",
		"core.event_is_draft": "event is not published",
		"core.cannot_delete_published": "cannot delete published event",

		"core.dict_not_exist": "the dictionary for $1 does not exist",
		"core.wrong_login_format": "wrong login format",
		"core.wrong_csid_message": "wrong session id check message(should be 'hello')",
		"core.wrong_encop_format": "wrong encrypted operation format",
		"core.int_not_exist": "no such interface",
		"core.action_not_exist": "no such action",
		"core.max_event_count": "you cannot created too many events due to your level",

		"core.out_of_range": "$1 out of range",

		"core.dup_user_name": "duplicated user login name",
		"core.wrong_user_passwd": "wrong user name or password",
		"core.invalid_user_name": "invalid user name",

		"core.session_timeout": "session timeout",

		"core.expect_argument": "expecting argument '$1'",
		"core.expect_argument_type": "expecting argument '$1' of type $2",
		"core.wrong_json_format": "wrong json format",

		"core.smsg.failed_get": "failed to reach smsg service",
		"core.smsg.bad_res_format": "bad result format",
		"core.smsg.failed_send_code": "failed to send code",
		"core.smsg.wrong_phone_format": "wrong phone number format",
		"core.smsg.failed_verify": "failed to verify code",
		"core.smsg.no_appkey": "no app key or secret key",
		"core.smsg.service_rej": "smsg service reject",

		"core.pm.no_sender": "no sender",
		"core.pm.no_sendee": "no sendee",
		"core.pm.no_msg": "no message",

		"core.notice.event_notice": "Event Notice: $1",
		"core.notice.untitled": "(untitled)",
		"core.notice.no_type": "no notice type",
		"core.notice.no_sender": "no notice sender",
		"core.notice.no_msg": "no notice content",

		"core.comment.no_uuid": "no comment sender",
		"core.comment.no_comment": "no comment content",
		"core.comment.issue_failed": "failed to issue comment",
		"core.comment.empty": "(no comment)",
		"core.comment.already_voted": "you've already upvoted",
		"core.comment.max_comm_reached": "max comment count reached",

		"front.com.parts.fail_get_url": "fail to get url $1: $2",
		"front.com.lang.fail_load_dict": "fail to load dictionary of $1",

		"front.sub.profile.anonymous": "anonymous",
		"front.sub.profile.no_intro": "no introduction",
		"front.sub.profile.no_more_result": "no more results",
		"front.sub.profile.applied": "applied",
		"front.sub.profile.organized": "organized",
		"front.sub.profile.draft": "draft",
		"front.sub.profile.new": "new",
		"front.sub.profile.save": "save",
		"front.sub.profile.template": "template",
		"front.sub.profile.success": "success",

		"front.sub.profile.basic": "basic",
		"front.sub.profile.publish": "publish",
		"front.sub.profile.location": "location",
		"front.sub.profile.cover": "cover",
		"front.sub.profile.folllower": "followers",
		"front.sub.profile.follows": "follows",
		"front.sub.profile.period": ".",
		"front.sub.profile.no_selected": "you haven't selected any $1",
		"front.sub.profile.sure_to_leave": "are you sure to leave",
		"front.sub.profile.publish_event": "publish your event now for everyone!",
		"front.sub.profile.custom_event_prompt": "click the picture to change cover and the add button below to add tags",
		"front.sub.profile.you_can_go_tab_to_view": "you can now go to the '$1' tab to view your event",
		"front.sub.profile.illegal_uuid": "illegal user id",
		"front.sub.profile.save_draft": "draft saved",

		"front.sub.appcent.staff": "$nat.cap($core.word.staff)",
		"front.sub.appcent.partic": "$nat.cap($core.word.partic)",
		"front.sub.appcent.no_app": "no application",

		"front.sub.appcent.accept": "Accept",
		"front.sub.appcent.decline": "Decline",
		"front.sub.appcent.notice": "Notice",

		"front.sub.appcent.status": "Status",
		"front.sub.appcent.user": "User",
		"front.sub.appcent.apply_for": "Apply for",

		"front.sub.event.show_more": "More",
		"front.sub.event.detail": "Detail",
		"front.sub.event.view": "View",

		"front.sub.event.organizer": "$nat.cap($core.word.org)",
		"front.sub.event.apply_for": "Apply for",
		"front.sub.event.app_cent": "Application center",
		"front.sub.event.staff": "$nat.cap($core.word.staff)",
		"front.sub.event.partic": "$nat.cap($core.word.partic)",
		"front.sub.event.comments": "Comments",

		"front.sub.event.click_for_more": "Click for more",

		"front.sub.event.no_euid": "no event uid given",
		"front.sub.event.illegal_euid": "illegal event uid",

		"front.com.event.accepted": "Accepted",
		"front.com.event.declined": "Declined",
		"front.com.event.pending": "Pending",

		"front.com.event.change_cover": "Change cover",
		"front.com.event.change_logo": "Change logo",
		"front.com.event.more": "$nat.all_cap(more)",

		"front.com.login.logo_prompt": "Experiences worth sharing",
		"front.com.login.verify": "Verify",
		"front.com.login.register": "Register",
		"front.com.login.login": "Login",

		"front.com.login.back": "Back",
		"front.com.login.finish": "Finish",
	},

	"chinese": {
		"impossible": "impossible: $1",
		"unsupported": "there is a vital component($1) not supported by your browser",

		"core.foci": "Foci",

		"core.word.rsakey": "RSA key",
		"core.word.title": "title",
		"core.word.descr": "description",
		"core.word.date": "date",
		"core.word.file_id": "file id",
		"core.word.file": "file",
		"core.word.search_keyword": "search keyword",
		"core.word.search_result": "search result",
		"core.word.app_form": "application form",

		"core.word.comment": "comment",
		"core.word.rating": "rating",

		"core.word.event": "event",
		"core.word.draft": "draft",

		"core.word.user": "user",
		"core.word.dname": "display name",
		"core.word.age": "age",
		"core.word.intro": "self introduction",
		"core.word.school": "school name",
		"core.word.tag": "tag",
		"core.word.sortby": "sort condition",

		"core.word.staff": "staff",
		"core.word.partic": "participant",
		"core.word.org": "organizer",

		"core.word.sid": "session id",
		"core.word.string": "string",

		"core.word.msg": "message",

		"core.internal_err": "internal error",
		"core.assert_failed": "assertion failed",

		"core.fail_upload": "fail to upload file",
		"core.too_long": "$1 too long",
		"core.illegal": "illegal $1",
		"core.illegal_expect_partic": "illegal expected participant number",
		"core.too_many": "too many $1s",
		"core.not_exist": "no such $1",
		"core.not_event_owner": "you're not the owner of this event",
		"core.not_event_applicant": "someone in the list is not an applicant",

		"core.illegal_app_type": "illegal type of application",
		"core.illegal_app_status": "illegal application status",
		"core.app_full": "application is full",
		"core.dup_app": "duplicated applications",
		"core.app_own_event": "you can't apply for your own event",

		"core.event_not_draft": "event not a draft",
		"core.event_is_draft": "event is not published",
		"core.cannot_delete_published": "cannot delete published event",

		"core.dict_not_exist": "the dictionary for $1 does not exist",
		"core.wrong_login_format": "wrong login format",
		"core.wrong_csid_message": "wrong session id check message(should be 'hello')",
		"core.wrong_encop_format": "wrong encrypted operation format",
		"core.int_not_exist": "no such interface",
		"core.action_not_exist": "no such action",
		"core.max_event_count": "you cannot created too many events due to your level",

		"core.out_of_range": "$1 out of range",

		"core.dup_user_name": "duplicated user login name",
		"core.wrong_user_passwd": "wrong user name or password",
		"core.invalid_user_name": "invalid user name",

		"core.session_timeout": "session timeout",

		"core.expect_argument": "expecting argument '$1'",
		"core.expect_argument_type": "expecting argument '$1' of type $2",
		"core.wrong_json_format": "wrong json format",

		"core.smsg.failed_get": "failed to reach smsg service",
		"core.smsg.bad_res_format": "bad result format",
		"core.smsg.failed_send_code": "failed to send code",
		"core.smsg.wrong_phone_format": "wrong phone number format",
		"core.smsg.failed_verify": "failed to verify code",
		"core.smsg.no_appkey": "no app key or secret key",
		"core.smsg.service_rej": "smsg service reject",

		"core.pm.no_sender": "no sender",
		"core.pm.no_sendee": "no sendee",
		"core.pm.no_msg": "no message",

		"core.notice.event_notice": "Event Notice: $1",
		"core.notice.untitled": "(untitled)",
		"core.notice.no_type": "no notice type",
		"core.notice.no_sender": "no notice sender",
		"core.notice.no_msg": "no notice content",

		"core.comment.no_uuid": "no comment sender",
		"core.comment.no_comment": "no comment content",
		"core.comment.issue_failed": "failed to issue comment",
		"core.comment.empty": "(no comment)",
		"core.comment.already_voted": "you've already upvoted",
		"core.comment.max_comm_reached": "max comment count reached",

		"front.com.parts.fail_get_url": "fail to get url $1: $2",
		"front.com.lang.fail_load_dict": "fail to load dictionary of $1",

		"front.sub.profile.anonymous": "anonymous",
		"front.sub.profile.no_intro": "no introduction",
		"front.sub.profile.no_more_result": "no more results",
		"front.sub.profile.applied": "applied",
		"front.sub.profile.organized": "organized",
		"front.sub.profile.draft": "draft",
		"front.sub.profile.new": "new",
		"front.sub.profile.save": "save",
		"front.sub.profile.template": "template",
		"front.sub.profile.success": "success",

		"front.sub.profile.basic": "basic",
		"front.sub.profile.publish": "publish",
		"front.sub.profile.location": "location",
		"front.sub.profile.cover": "cover",
		"front.sub.profile.folllower": "followers",
		"front.sub.profile.follows": "follows",
		"front.sub.profile.period": ".",
		"front.sub.profile.no_selected": "you haven't selected any $1",
		"front.sub.profile.sure_to_leave": "are you sure to leave",
		"front.sub.profile.publish_event": "publish your event now for everyone!",
		"front.sub.profile.custom_event_prompt": "click the picture to change cover and the add button below to add tags",
		"front.sub.profile.you_can_go_tab_to_view": "you can now go to the '$1' tab to view your event",
		"front.sub.profile.illegal_uuid": "illegal user id",
		"front.sub.profile.save_draft": "draft saved",

		"front.sub.appcent.staff": "$nat.cap($core.word.staff)",
		"front.sub.appcent.partic": "$nat.cap($core.word.partic)",
		"front.sub.appcent.no_app": "no application",

		"front.sub.appcent.accept": "Accept",
		"front.sub.appcent.decline": "Decline",
		"front.sub.appcent.notice": "Notice",

		"front.sub.appcent.status": "Status",
		"front.sub.appcent.user": "User",
		"front.sub.appcent.apply_for": "Apply for",

		"front.sub.event.show_more": "More",
		"front.sub.event.detail": "Detail",
		"front.sub.event.view": "View",

		"front.sub.event.organizer": "$nat.cap($core.word.org)",
		"front.sub.event.apply_for": "Apply for",
		"front.sub.event.app_cent": "Application center",
		"front.sub.event.staff": "$nat.cap($core.word.staff)",
		"front.sub.event.partic": "$nat.cap($core.word.partic)",
		"front.sub.event.comments": "Comments",

		"front.sub.event.click_for_more": "Click for more",

		"front.sub.event.no_euid": "no event uid given",
		"front.sub.event.illegal_euid": "illegal event uid",

		"front.com.event.accepted": "Accepted",
		"front.com.event.declined": "Declined",
		"front.com.event.pending": "Pending",

		"front.com.event.change_cover": "Change cover",
		"front.com.event.change_logo": "Change logo",
		"front.com.event.more": "$nat.all_cap(more)",

		"front.com.login.logo_prompt": "Experiences worth sharing",
		"front.com.login.verify": "Verify",
		"front.com.login.register": "Register",
		"front.com.login.login": "Login",

		"front.com.login.back": "Back",
		"front.com.login.finish": "Finish",
	}
};
