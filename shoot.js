var config = require("./core/config");

config.captcha.disabled = true;
config.db.name = "foci-main-shot";

require("./main");
