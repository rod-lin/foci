/* captcha */

"use strict";

define([ "com/util" ], function (util) {
    var $ = jQuery;
    foci.loadCSS("com/captcha.css");
    
    /*
        challenge {
            gt, challenge, offline
        }
     */
    function modal(challenge, cb, config) {
        config = $.extend({}, config);
        
        var main = $("<div class='com-captcha-modal ui basic small modal'> \
            <div class='captcha-field'> \
                <div class='prompt'>Sorry we have to make sure you're not a robot</div> \
            </div> \
        </div>");
        
        var valid_data = null;
        var has_hidden = false;
        
        main.modal({
            onHide: function () {
                if (has_hidden) return;
                has_hidden = true;
                
                if (valid_data)
                    cb(true, valid_data);
                else
                    cb(false);
            }
        });
        
        initGeetest({
            gt: challenge.gt,
            challenge: challenge.challenge,
            offline: challenge.offline,
            new_captcha: true,
            
            width: "100%",
            lang: "en"
        }, function (cap) {
            cap.appendTo(main.find(".captcha-field")[0]);
            main.modal("show");
            
            cap.onSuccess(function () {
                var ans = cap.getValidate();
                
                valid_data = {
                    challenge: ans.geetest_challenge,
                    validate: ans.geetest_validate,
                    seccode: ans.geetest_seccode
                };
                
                main.modal("hide");
            });
            
            cap.onError(function () {
                util.emsg("$def.fail_show_captcha");
                main.modal("hide");
            });
        });
    }
    
    // foci event redirects here
    function wrap(challenge, resend) {
        // console.log(challenge);
        modal(challenge, function (suc, dat) {
            if (suc) {
                resend(true, dat);
            } else {
                resend(false, "$def.request_cancelled");
            }
        }, {});
    }
    
    return {
        wrap: wrap,
        modal: modal
    };
});
