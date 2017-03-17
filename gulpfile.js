var browserify = require("browserify");
var source = require("vinyl-source-stream");
var gulp = require("gulp");

gulp.task("default", () =>
	browserify("client/fcauth.js")
	.bundle()
	.pipe(source("fcauth.js"))
	.pipe(gulp.dest("test/"))
);
