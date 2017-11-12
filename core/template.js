var user = require("./user");
var club = require("./club");
var util = require("./util");
var cutil = require("./cutil");

var xss = require("xss");

exports.event_apply = async (title, job) => ({
	title: `You just applied for ${title}`,
	msg: `Thank you for applying to ${title} as a ${job}. You can find further info about the application status in your profile.`
});

var wrap = a => a;

exports.markdown_edit = async (uuid) => {
	var name = (await user.uuid(uuid)).getDName();
	return wrap(
`
Hi ${name}, 第一次使用Markdown?
=============================
这里有一些关于使用Markdown的小提示：

1. 如果你还不知道Markdown是什么：
	> Markdown是一种可以使用普通文本编辑器编写的标记语言，通过简单的标记语法，它可以使普通文本内容具有一定的格式。
	> -- 百度百科

2. 为什么我们选择了Markdown  
	因为本人比较偷懒（并且Markdown的确很好呀）

3. 如何优雅编写Markdown
	这里有几份关于Markdown编写的小指南：

	1. [献给写作者的 Markdown 新手指南（简书）](http://www.jianshu.com/p/q81RER/)
	2. [Markdown——入门指南（还是简书）](http://www.jianshu.com/p/1e402922ee32/)
	3. [Markdown 快速入门](http://wowubuntu.com/markdown/basic.html)

	以及除了Foci上这个简陋编辑器之外的许多Markdown编辑器：

	1. [StackEdit](https://stackedit.io/editor)
	2. [Ulysses(Mac)](https://ulyssesapp.com/)
	3. [Dillinger](http://dillinger.io/)
	4. [Typora](https://typora.io/)

	在这些编辑器编辑好后可以直接拷贝源码到Foci活动介绍的输入框中
`
	);
};

exports.email_vericode = async (code) => {
	return wrap({
		title: "Foci - Verification Code",
		cont:
`
Hi, welcome to Foci!<br>
Your verification code is ${code}<br>
DON'T TELL ANYONE ABOUT IT!<br>
<br>
(and sorry about this brutal theme)
`
	});
};

exports.club_invitation = async (cuid, uuid) => {
	var clb = await club.cuid(cuid);
	var usr = await user.uuid(uuid);
	
	var club_name = xss(clb.getDName());
	var user_name = xss(usr.getDName());
	
	return {
		title: `Invitation from ${club_name}`,
		msg:
`Hi ${user_name}, this is an invitation from <b>${club_name}</b>.<br>
Visit <a href="#clubcent/${clb.cuid}/member">this link</a> to join!`
	};
};

exports.club_assignment = async (cuid, assigner, puid) => {
	var clb = await club.cuid(cuid);
	var boss = await user.uuid(assigner);
	
	var club_name = xss(clb.getDName());
	var boss_name = xss(boss.getDName());
	
	return {
		title: `Assignment update from ${club_name}`,
		format: "html",
		msg:
`Hi, <b>${boss_name}</b> in club <b>${club_name}</b> just assigned you a new job.<br>
View more info from <a href="#clubcent/${clb.cuid}/forum/${puid}">here</a>`
	};
};

exports.cutil_form_submit = async (uuid, cuuid, url) => {
	var utl = await cutil.cuuid(cuuid);
	var usr = await user.uuid(uuid);

	return {
		title: `Form submitted for ${utl.getName()}`,
		format: "html",
		msg:
`Hi, user <b>${usr.getDName()}</b> has just submitted a application form for club utility <b>${utl.getName()}</b>.<br>
Click <a href="${url}">here</a> to review the form</a>`
	};
};

exports.bug_report = async (report, time, env) => {
	return (
`
<b>Bug Report</b><br><br>
Report time: ${new Date().toUTCString()}<br>
Client IP: ${env.ip()}<br>
Report: ${util.beautifyJSON(report).replace(/\n/g, "<br>").replace(/\s/g, "&nbsp;")}
`		
);
};
