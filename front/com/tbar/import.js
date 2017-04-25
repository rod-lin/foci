/* top bar */

/* require jQuery, semantic */

if (!window.fcom) window.fcom = {};

(function (com) {
	com.init = function (config) {
		config = $.extend({
			max_search_res: 7
		}, config);

		var main = ' \
			<div class="com-tbar"> \
				<div class="left-bar"> \
					<i class="tumblr square icon logo vcenter"></i> \
					<div class="ui search vcenter"> \
						<div class="ui icon input"> \
							<input class="prompt" placeholder="Type for surprise" type="text"> \
							<i class="rocket icon search-icon"></i> \
						</div> \
						<div class="results"></div> \
					</div> \
					<div class="links avcenter"> \
						<div class="link">home</div> \
						<div class="link">plaza</div> \
					</div> \
				</div> \
				<div class="right-bar"> \
					<div class="avatar vcenter" style="background-image: url(\'img/deficon.jpg\');"></div> \
					<div class="ui popup transition hidden"> \
						<div class="title">Rodlin</div> \
						<div class="ui star mini rating bottom right" data-rating="4" data-max-rating="5"></div> \
					</div> \
				</div> \
			</div> \
		';
		main = $(main);

		$("body").append(main);
		
		$(".com-tbar").find(".rating").rating("disable");
		$(".com-tbar .avatar")
			.popup({
				popup: $(".com-tbar").find(".popup"),
				position: "bottom right",
				hoverable: true
			});

		var search = function (e) {
			if (!e || e.keyCode == 13) {
				alert("search");
			}
		};

		$(".com-tbar .prompt").keydown(search);

		$(".com-tbar .search").search({
			apiSettings: {
				url: "/event/search?kw={query}",
				onResponse: function(resp) {
					var ret = [];

					if (resp.suc) {
						var len =
							config.max_search_res < resp.res.length
							? config.max_search_res : resp.res.length;

						// alert("here");

						for (var i = 0; i < len; i++) {
							// alert(resp.res[i].title);
							ret.push({
								title: resp.res[i].title,
								description: resp.res[i].descr
							});
						}

						return { results: ret };
					} else {
						console.log("failed to connect to the server");
					}
				}
			},

			onSelect: function () { search(); }
		});
	};
})(fcom.tbar = {});
