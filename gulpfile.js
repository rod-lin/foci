var browserify = require("browserify");
var source = require("vinyl-source-stream");
var gulp = require("gulp");

gulp.task("default", () => {
	var comp = file =>
		browserify("client/" + file)
		.bundle()
		.pipe(source(file))
		.pipe(gulp.dest("test/"));

	comp("fcauth.js");
	comp("vcent.js");
});
