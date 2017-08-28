/* language pack */

"use strict";

var util = require("./util");

var dict = module.exports = {
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
		"core.word.system_sender": "system sender",

		"core.word.staff": "staff",
		"core.word.partic": "participant",
		"core.word.org": "organizer",

		"core.word.sid": "session id",
		"core.word.string": "string",

		"core.word.template": "template",

		"core.word.msg": "message",

		"core.internal_err": "internal error",
		"core.assert_failed": "assertion failed",

		"core.permission_denied": "permission denied",

		"core.illegal_upload_type": "you cannot upload a file with this type",
		"core.file_missing": "file $1 missing(contact me if this keeps poping up)",
		"core.file_md5_collision": "file md5 collision(DO CONTACT ME IF YOU SEE THIS)",

		"core.cap_verification_failed": "captcha validation failed",

		"core.account_frozen": "account frozen for an hour for repeated tries to login",

		"core.fail_upload": "fail to upload file",
		"core.too_long": "$1 too long",
		"core.illegal": "illegal $1",
		"core.illegal_expect_partic": "illegal expected participant number",
		"core.too_many": "too many $1s",
		"core.not_exist": "no such $1",
		"core.not_event_owner": "you're not the owner of this event",
		"core.not_event_applicant": "someone in the list is not an applicant",
		"core.not_event_partic": "you're not a participant of this event",
		"core.not_event_staff": "you're not a staff of this event",
		"core.unable_to_terminate": "unable to terminate event in this state",

		"core.illegal_app_type": "illegal type of application",
		"core.illegal_app_status": "illegal application status",
		"core.app_full": "application is full",
		"core.dup_app": "duplicated applications",
		"core.app_own_event": "you can't apply for your own event",
		"core.app_closed": "Application is currently closed",

		"core.event_not_draft": "event not a draft",
		"core.event_is_draft": "event is not published",
		"core.cannot_delete_published": "cannot delete published event",

		"core.dict_not_exist": "the dictionary for $1 does not exist",
		"core.wrong_login_format": "wrong login format",
		"core.wrong_csid_message": "wrong session id check message(should be 'hello')",
		"core.wrong_encop_format": "wrong encrypted operation format",
		"core.int_not_exist": "no such interface",
		"core.action_not_exist": "no such action",
		"core.max_event_count": "you cannot created too many events due to your level limit",

		"core.too_many_drafts": "you cannot create too many drafts",

		"core.out_of_range": "$1 out of range",

		"core.dup_user_name": "duplicated user login name",
		"core.wrong_user_passwd": "wrong user name or password",
		"core.invalid_user_name": "invalid user name",

		"core.session_timeout": "session timeout",
		"core.illegal_session": "your account has been re-logged in elsewhere<br>try to re-log in",

		"core.expect_argument": "expecting argument '$1'",
		"core.expect_argument_type": "expecting argument '$1' of type $2",
		"core.wrong_json_format": "wrong json format",

		"core.smsg.failed_get": "failed to reach smsg service",
		"core.smsg.bad_res_format": "bad result format",
		"core.smsg.failed_send_code": "failed to send code",
		"core.smsg.wrong_phone_format": "wrong phone number format",
		"core.smsg.no_appkey": "no app key or secret key",
		"core.smsg.service_rej": "smsg service reject",

		"core.mail.failed_send": "failed to send email",

		"core.reg.failed_verify": "failed to verify code",
		"core.reg.vercode_timeout": "verification code timeout",

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
		"front.sub.profile.resume": "resume",
		"front.sub.profile.draft": "draft",
		"front.sub.profile.new": "<i class='add icon'></i> New",
		"front.sub.profile.save": "<span style='color: #27AE60;'><i class='check icon'></i> Save</span>",
		"front.sub.profile.template": "$core.word.template",
		"front.sub.profile.success": "success",

		"front.sub.profile.new.info": "Info",
		"front.sub.profile.new.info_subtitle": "Title and description",
		"front.sub.profile.new.cover": "Cover",
		"front.sub.profile.new.cover_subtitle": "Cover and tags",
		"front.sub.profile.new.time": "Dates",
		"front.sub.profile.new.time_subtitle": "Event timeline",
		"front.sub.profile.new.location": "Location",
		"front.sub.profile.new.location_subtitle": "Event location",
		"front.sub.profile.new.payment": "Payment",
		"front.sub.profile.new.payment_subtitle": "Payment method",
		"front.sub.profile.new.applicant": "Applicants",
		"front.sub.profile.new.applicant_subtitle": "Application settings",
		"front.sub.profile.new.detail": "Detail",
		"front.sub.profile.new.detail_subtitle": "Additional info",
		"front.sub.profile.new.publish": "Publish",
		"front.sub.profile.new.publish_subtitle": "Submit event",
		"front.sub.profile.new.other": "Other",
		"front.sub.profile.new.other_subtitle": "Additional actions",

		"front.sub.profile.start_end_date": "Start/End Date",
		"front.sub.profile.start_date": "Event start date",
		"front.sub.profile.end_date": "Event end date",

		"front.sub.profile.new.title": "Title",
		"front.sub.profile.new.descr": "Description",
		"front.sub.profile.new.no_limit_in_def": "no limit in default",

		"front.sub.profile.app_form": "Application forms",
		"front.sub.profile.staff_form": "Staff form",
		"front.sub.profile.partic_form": "Participant form",
		"front.sub.profile.create": "Create",
		"front.sub.profile.edit": "Edit",
		"front.sub.profile.limitation": "Limitations",
		"front.sub.profile.max_staff": "Max staff number",
		"front.sub.profile.max_partic": "Max participant number",
		"front.sub.profile.detail": "Details",
		"front.sub.profile.trivial_notice": "Trivial notice",
		"front.sub.profile.trivial_notice_prompt": "This notice will be shown on the event page",

		"front.sub.profile.change_event_state": "Change event state",
		"front.sub.profile.delete_event": "Delete event",
		"front.sub.profile.delete_event.prompt": "ALL data will be lost. Only draft event can be deleted.<br>If you want to delete a public event, please contact(email) us for assistance.",
		"front.sub.profile.delete_event_ask": "Are you sure to delete this event",
		"front.sub.profile.delete": "Delete",
		"front.sub.profile.help": "Help",
		"front.sub.profile.unpublish": "Unpublish",
		"front.sub.profile.unpublish_prompt": "Change this event to draft state.<br>All info will be saved, but other users will not be able to view this event.",

		"front.sub.profile.event_deleted": "event deleted",
		"front.sub.profile.event_unpublished": "event unpublished",

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
		"front.sub.profile.submit_event_review": "submit draft for review",
		"front.sub.profile.custom_event_prompt": "click the picture to change cover and the add button below to add tags",
		"front.sub.profile.you_can_go_tab_to_view": "you can now go to the '$1' tab to view your event",
		"front.sub.profile.illegal_uuid": "illegal user id",
		"front.sub.profile.save_draft": "draft/event saved",
		
		"front.sub.profile.under_review": "event is under review, please wait",
		"front.sub.profile.event_published": "event is published",
		"front.sub.profile.event_terminated": "event is terminated",
		
		"front.sub.profile.app_cent": "$front.sub.event.app_cent",

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
		"front.sub.event.thank_you": "Thank you",
		"front.sub.event.login_first": "<span><a href='javascript:void(0)'>Login</a> first</span>",
		"front.sub.event.organize": "Organize",
		"front.sub.event.app_cent": "Application center",
		"front.sub.event.term_event": "End event",
		"front.sub.event.event_setting": "Settings",
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

		"front.com.login.user_name": "phone number/email",
		"front.com.login.passwd": "password",
		"front.com.login.code": "code",
		"front.com.login.illegal_user_name": "illegal phone number/email",
		"front.com.login.empty": "empty $1",

		"front.com.tbar.profile": "Profile",
		"front.com.tbar.logout": "Logout",
		"front.com.tbar.search_prompt": "Search",

		"front.com.event.sortby.create": "create time",
		"front.com.event.sortby.popularity": "popularity",
	}
};

dict["chinese"] = {}.extend(dict["english"]).extend({
		"impossible": "impossible: $1",
		"unsupported": "你的浏览器不支持一个关键组件($1)",

		"core.foci": "Foci",

		"core.word.rsakey": "RSA秘钥",
		"core.word.title": "标题",
		"core.word.descr": "描述",
		"core.word.date": "日期",
		"core.word.file_id": "文件代码",
		"core.word.file": "文件",
		"core.word.search_keyword": "搜索关键词",
		"core.word.search_result": "搜索结果",
		"core.word.app_form": "申请表",

		"core.word.template": "模板",
		"core.word.comment": "评论",
		"core.word.rating": "评分",

		"core.word.event": "活动",
		"core.word.draft": "草稿",

		"core.word.user": "用户",
		"core.word.dname": "用户名",
		"core.word.age": "年龄",
		"core.word.intro": "个人介绍",
		"core.word.school": "学校名",
		"core.word.tag": "标签",
		"core.word.sortby": "排序方式",

		"core.word.staff": "工作人员",
		"core.word.partic": "参与者",
		"core.word.org": "组织者",

		"core.word.sid": "会话",
		"core.word.string": "字符串",

		"core.word.msg": "消息",

		"core.internal_err": "内部错误",
		"core.assert_failed": "断言错误",

		"core.fail_upload": "无法上传文件",
		"core.too_long": "$1太长",
		"core.illegal": "非法$1",
		"core.illegal_expect_partic": "非法的活动参与者数量",
		"core.too_many": "太多$1",
		"core.not_exist": "没有$1",
		"core.not_event_owner": "你不是此活动的所有者",
		"core.not_event_applicant": "列表中有人不是活动参与者",

		"core.illegal_app_type": "非法申请类型",
		"core.illegal_app_status": "非法申请状态",
		"core.app_full": "申请已满",
		"core.dup_app": "不能重复申请",
		"core.app_own_event": "不能申请自己的活动",

		"core.event_not_draft": "活动不是草稿",
		"core.event_is_draft": "活动还未发布",
		"core.cannot_delete_published": "不能删除已发布活动",

		"core.dict_not_exist": "$1的翻译字典不存在",
		"core.wrong_login_format": "登录格式错误",
		"core.wrong_csid_message": "格式错误",
		"core.wrong_encop_format": "加密操作格式错误",
		"core.int_not_exist": "没有这个接口",
		"core.action_not_exist": "没有这个操作",
		"core.max_event_count": "你不能创建更多活动因为等级过低",

		"core.out_of_range": "$1超出范围",

		"core.dup_user_name": "用户名已注册",
		"core.wrong_user_passwd": "用户名或密码错误",
		"core.invalid_user_name": "用户名不合法",

		"core.session_timeout": "会话已过期",

		"core.expect_argument": "缺少参数'$1'",
		"core.expect_argument_type": "参数'$1'应为$2类型",
		"core.wrong_json_format": "JSON格式错误",

		"core.smsg.failed_get": "短信发送失败（请联系我们）",
		"core.smsg.bad_res_format": "短信服务格式错误",
		"core.smsg.failed_send_code": "无法发送验证码",
		"core.smsg.wrong_phone_format": "手机号格式错误",
		"core.smsg.failed_verify": "验证码验证失败",
		"core.smsg.no_appkey": "短信服务未设置",
		"core.smsg.service_rej": "短信发送失败（请联系我们）",

		"core.pm.no_sender": "没有发件人",
		"core.pm.no_sendee": "没有收件人",
		"core.pm.no_msg": "没有消息",

		"core.notice.event_notice": "活动消息: $1",
		"core.notice.untitled": "(未命名)",
		"core.notice.no_type": "没有提醒类型",
		"core.notice.no_sender": "没有发送人",
		"core.notice.no_msg": "没有提醒内容",

		"core.comment.no_uuid": "没有评论人",
		"core.comment.no_comment": "没有评论内容",
		"core.comment.issue_failed": "发送评论失败",
		"core.comment.empty": "(没有评论)",
		"core.comment.already_voted": "你已经赞过了",
		"core.comment.max_comm_reached": "已达到最大评论数",

		"front.com.parts.fail_get_url": "fail to get url $1: $2",
		"front.com.lang.fail_load_dict": "fail to load dictionary of $1",

		"front.sub.profile.anonymous": "匿名",
		"front.sub.profile.no_intro": "没有介绍",
		"front.sub.profile.no_more_result": "到底啦",
		"front.sub.profile.applied": "申请过",
		"front.sub.profile.organized": "组织过",
		"front.sub.profile.draft": "草稿",
		"front.sub.profile.new": "<i class='add icon'></i> 新建",
		"front.sub.profile.save": "<span style='color: #27AE60;'><i class='check icon'></i> 保存</span>",
		"front.sub.profile.template": "$core.word.template",
		"front.sub.profile.success": "成功",

		"front.sub.profile.new.info": "信息",
		"front.sub.profile.new.info_subtitle": "标题和描述",
		"front.sub.profile.new.cover": "封面",
		"front.sub.profile.new.cover_subtitle": "封面和标签",
		"front.sub.profile.new.location": "地址",
		"front.sub.profile.new.location_subtitle": "活动地址",
		"front.sub.profile.new.payment": "付款",
		"front.sub.profile.new.payment_subtitle": "支付方式",
		"front.sub.profile.new.applicant": "申请者",
		"front.sub.profile.new.applicant_subtitle": "申请设置",
		"front.sub.profile.new.detail": "详细信息",
		"front.sub.profile.new.detail_subtitle": "活动注意事项",
		"front.sub.profile.new.publish": "发布",
		"front.sub.profile.new.publish_subtitle": "发布活动/活动审核",
		"front.sub.profile.new.other": "其他",
		"front.sub.profile.new.other_subtitle": "其他操作",

		"front.sub.profile.app_form": "活动表格",
		"front.sub.profile.staff_form": "工作人员表格",
		"front.sub.profile.partic_form": "参与者表格",
		"front.sub.profile.create": "创建",
		"front.sub.profile.edit": "修改",
		"front.sub.profile.limitation": "限制",
		"front.sub.profile.max_staff": "最多工作人员",
		"front.sub.profile.max_partic": "最多参与者",
		"front.sub.profile.detail": "详细",
		"front.sub.profile.trivial_notice": "详细信息",
		"front.sub.profile.trivial_notice_prompt": "这些信息会在活动主页上显示",

		"front.sub.profile.change_event_state": "改变活动状态",
		"front.sub.profile.delete_event": "删除活动",
		"front.sub.profile.delete_event.prompt": "所有数据都会丢失。只有草稿可以被删除。<br>如果你想删除一个已公开的活动，请联系Foci工作人员",
		"front.sub.profile.delete_event_ask": "你确定要删除活动吗",
		"front.sub.profile.delete": "删除",
		"front.sub.profile.help": "帮助",
		"front.sub.profile.unpublish": "下线",
		"front.sub.profile.unpublish_prompt": "将活动改为草稿<br>所有信息将会保留，但用户将无法查看活动",
		"front.sub.profile.new.title": "标题",
		"front.sub.profile.new.descr": "描述",
		"front.sub.profile.new.no_limit_in_def": "默认无限制",

		"front.sub.profile.event_deleted": "活动已删除",
		"front.sub.profile.event_unpublished": "活动已下线",

		"front.sub.profile.location": "地点",
		"front.sub.profile.cover": "封面",
		"front.sub.profile.folllower": "followers",
		"front.sub.profile.follows": "follows",
		"front.sub.profile.period": "。",
		"front.sub.profile.no_selected": "你还没有选$1",
		"front.sub.profile.sure_to_leave": "你确定要离开吗",
		"front.sub.profile.publish_event": "发布活动！",
		"front.sub.profile.submit_event_review": "提交审核",
		"front.sub.profile.custom_event_prompt": "点击图片改封面。点击下方加号修改标签",
		"front.sub.profile.you_can_go_tab_to_view": "你可以去'$1'标签查看发布的活动",
		"front.sub.profile.illegal_uuid": "非法用户",
		"front.sub.profile.save_draft": "草稿已保存",

		"front.sub.appcent.staff": "$nat.cap($core.word.staff)",
		"front.sub.appcent.partic": "$nat.cap($core.word.partic)",
		"front.sub.appcent.no_app": "没有申请",

		"front.sub.appcent.accept": "录取",
		"front.sub.appcent.decline": "拒绝",
		"front.sub.appcent.notice": "提醒",

		"front.sub.appcent.status": "状态",
		"front.sub.appcent.user": "用户",
		"front.sub.appcent.apply_for": "申请",

		"front.sub.event.show_more": "更多内容",
		"front.sub.event.detail": "注意事项",
		"front.sub.event.view": "查看",

		"front.sub.event.organizer": "$nat.cap($core.word.org)",
		"front.sub.event.apply_for": "申请",
		"front.sub.event.app_cent": "申请中心",
		"front.sub.event.staff": "$nat.cap($core.word.staff)",
		"front.sub.event.partic": "$nat.cap($core.word.partic)",
		"front.sub.event.comments": "评论",

		"front.sub.event.click_for_more": "点击查看更多",

		"front.sub.event.no_euid": "没有活动号",
		"front.sub.event.illegal_euid": "非法活动号",

		"front.com.event.accepted": "录取",
		"front.com.event.declined": "失败",
		"front.com.event.pending": "等待",

		"front.com.event.change_cover": "修改封面",
		"front.com.event.change_logo": "修改图标",
		"front.com.event.more": "更多",

		"front.com.login.logo_prompt": "经验值得分享",
		"front.com.login.verify": "验证",
		"front.com.login.register": "注册",
		"front.com.login.login": "登录",

		"front.com.login.back": "返回",
		"front.com.login.finish": "完成",

		"front.com.login.phone_number": "手机号",
		"front.com.login.passwd": "密码",
		"front.com.login.code": "验证码",
		"front.com.login.illegal_phone": "假手机！",
		"front.com.login.empty_name": "用户名不能为空",
		"front.com.login.empty_passwd": "密码不能为空",

		"front.com.tbar.profile": "主页",
		"front.com.tbar.logout": "退出",
		"front.com.tbar.search_prompt": "搜索",

		"front.com.event.sortby.create": "创建日期",
		"front.com.event.sortby.popularity": "人气",
});
