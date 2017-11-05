/* club utility panel */

"use strict";

define([
    "com/util", "com/waterfall", "com/login",
    "com/upload", "com/userhunt"
], function (util, waterfall, login, upload, uh) {
    var $ = jQuery;
    foci.loadCSS("com/cutil.css");
    
    var cutil = {};
    
    cutil.editModal = function (info, config) {
        config = $.extend({
            // onChanged
        }, config);

        var modal = $("<div class='ui small modal com-cutil-edit-modal'> \
            <form class='ui form'> \
                <div class='ui field'> \
                    <label>Cover</label> \
                    <div class='field-cover'></div> \
                </div> \
                <div class='ui field'> \
                    <label>Name</label> \
                    <input class='field-name'> \
                </div> \
                <div class='ui field'> \
                    <label>Description</label> \
                    <textarea class='field-descr'></textarea> \
                </div> \
                <div class='ui field'> \
                    <label>URL</label> \
                    <input class='field-url'> \
                </div> \
                <div class='ui fields'> \
                    <div class='ui field'> \
                        <label>Administrator</label> \
                        <button type='button' class='ui button change-admin-btn'>Change administrator</button> \
                    </div> \
                    <div class='ui field'> \
                        <label>Enabled</label> \
                        <div class='ui toggle checkbox enable-check'> \
                            <input type='checkbox'> \
                            <label></label> \
                        </div> \
                    </div> \
                </div> \
                <div class='ui field'> \
                    <button type='button' class='ui button submit-btn'>Submit</button> \
                </div> \
            </form> \
        </div>");

        var cover_field = upload.field(modal.find(".field-cover"), {
            width: "20rem",
            height: "10rem"
        });

        modal.find(".change-admin-btn").click(function () {
            uh.modal(info.admin, function (selected) {
                info.admin = selected;
            });
        });

        cover_field.val(info.cover);
        modal.find(".field-name").val(info.name);
        modal.find(".field-descr").val(info.descr);
        modal.find(".field-url").val(info.url);

        modal.find(".enable-check").checkbox(info.enable ? "check" : "uncheck");

        modal.find(".submit-btn").click(function () {
            var cover = cover_field.val();
            var name = modal.find(".field-name").val();
            var descr = modal.find(".field-descr").val();
            var url = modal.find(".field-url").val();
            var enable = modal.find(".enable-check").checkbox("is checked");

            modal.find(".submit-btn").addClass("loading");
            
            login.session(function (session) {
                if (session) {
                    foci.encop(session, {
                        int: "cutil",
                        action: "setinfo",

                        cuuid: info.cuuid,

                        cover: cover,
                        name: name,
                        descr: descr,
                        url: url,
                        admin: info.admin,
                        enable: enable
                    }, function (suc, dat) {
                        modal.find(".submit-btn").removeClass("loading");

                        if (suc) {
                            if (config.onChanged)
                                config.onChanged();
                            
                            modal.modal("hide");
                        } else {
                            util.emsg(dat);
                        }
                    });
                } else {
                    modal.find(".submit-btn").removeClass("loading");
                }
            });
        });

        modal.find(".delete-btn").click(function () {
            util.ask("Are you sure to delete this discover item?", function (ans) {
                if (ans) {
                    modal.find(".delete-btn").addClass("loading");
                    login.session(function (session) {
                        if (session) {
                            foci.encop(session, {
                                int: "cutil",
                                action: "del",

                                cuuid: info.cuuid
                            }, function (suc, dat) {
                                modal.find(".delete-btn").removeClass("loading");

                                if (suc) {
                                    util.emsg("deleted", "info");

                                    modal.modal("hide");

                                    if (config.onChanged) {
                                        config.onChanged();
                                    }
                                } else {
                                    util.emsg(dat);
                                }
                            });
                        } else {
                            modal.find(".delete-btn").removeClass("loading");
                        }
                    });
                }
            });
        });
    
        modal.modal("show");
    };

    cutil.init = function (cont, config) {
        cont = $(cont);
        config = $.extend({
            show_header: true,
            editable: false,

            // onEdited
        }, config);

        var main = $("<div class='com-cutil-panel'> \
            <h3 class='ui grey header'>Club Utilities & Discover</h3> \
            <div class='board-set'></div> \
            <div class='load-prompt'>no more utilities</div> \
        </div>");

        if (!config.show_header) {
            main.find(".header").remove();
            main.find(".load-prompt").remove();
        }

        var board_set = main.find(".board-set");

        // bconf { title, descr, cover }
        function genBoard(bconf) {
            var bd = $("<div class='board'> \
                <div class='info'> \
                    <div class='vcenter'> \
                        <h3 class='title'></h3> \
                        <span class='descr'></span> \
                    </div> \
                </div> \
            </div>");

            if (bconf.cover)
                util.bgimg(bd, foci.download(bconf.cover));
            
            bd.find(".title").html(bconf.name);
            bd.find(".descr").html(bconf.descr);

            bd.click(function () {
                if (config.editable) {
                    cutil.editModal(bconf, {
                        onChanged: function () {
                            if (config.onEdited) {
                                config.onEdited();
                            }
                        }
                    });
                } else if (bconf.url) {
                    util.jump("#discover/" + bconf.cuuid + "/" + bconf.url);
                }
            });

            return bd;
        }

        var wf = waterfall.init(board_set, {
            onUpdate: function (pos) {
                main.children(".header").css("margin-left", (pos.left || 20) + "px");
            }
        });

        function reloadUtil() {
            wf.clear();

            foci.get("/cutil/all", { show_disabled: config.editable }, function (suc, dat) {
                if (suc) {
                    for (var i = 0; i < dat.length; i++) {
                        wf.add(genBoard(dat[i]));
                    }
                } else {
                    util.emsg(dat);
                }
            });
        }

        reloadUtil();

        // wf.add(genBoard({
        //     title: "McOriginal Care",
        //     descr: "A club organizing service and funding provided by McOriginal",
        //     url: "#discover/mcocare"
        // }));

        // wf.add(genBoard({
        //     title: "Poster Printing",
        //     descr: "Poster printing service"
        // }));

        // wf.add(genBoard({
        //     title: "File Storage",
        //     descr: "File storage & share service"
        // }));

        // wf.add(genBoard({
        //     title: "Quiz",
        //     descr: "Quiz helper"
        // }));

        setTimeout(wf.update, 300);

        cont.append(main);

        var mod = {};

        mod.updateWF = function () {
            wf.update();
        };

        return mod;
    };
    
    return cutil;
});
