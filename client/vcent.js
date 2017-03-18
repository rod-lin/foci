"user strict";

window.vcent = {};

vcent.update = function () {
	var e = $(".vcenter");
	var i;
	var cent = function (pr, e) { e.css("top", ((pr.height() - e.height()) / 2) + "px"); };

	e.css("position", "relative");

	for (i = 0; i < e.length; i++) {
		cent($(e[i]).parent(), $(e[i]));
	}

	return;
};

window.addEventListener("load", vcent.update);
window.addEventListener("resize", vcent.update);
