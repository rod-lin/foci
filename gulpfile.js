var browserify = require("browserify");
var streamify = require("gulp-streamify");
var source = require("vinyl-source-stream");
var uglify = require("gulp-uglify");
var gulp = require("gulp");


gulp.task("default", () => {
	var comp = file =>
		browserify("client/" + file)
		.bundle()
		.pipe(source(file))
		.pipe(streamify(uglify()))
		.pipe(gulp.dest("test/"));

	comp("fcauth.js");
	comp("vcent.js");
});
