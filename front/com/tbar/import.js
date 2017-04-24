/* top bar */

/* require jQuery, semantic */

if (!window.fcom) window.fcom = {};
fcom.tbar = {};

(function () {
	fcom.tbar.init = function () {
		var main = ' \
			<div class="com-tbar"> \
				<div class="left-bar vcenter"> \
					<i class="send outline icon logo"></i> \
					<span class="ui search"> \
						<div class="ui icon input"> \
							<input class="prompt" placeholder="Type for surprise" type="text"> \
							<i class="rocket icon"></i> \
						</div> \
						<div class="results"></div> \
					</span> \
				</div> \
			</div> \
		';

		$("body").append(main);
		$(".com-tbar .search").search({
			apiSettings: {
				url: "//api.github.com/search/repositories?q={query}"
			},

			fields: {
				results: "items",
				title: "name",
				url: "html_url"
			}
		});
	};
})();
