var browserify = require("browserify");
var streamify = require("gulp-streamify");
var source = require("vinyl-source-stream");
var uglify = require("gulp-uglify");
var gulp = require("gulp");

var
	sem_watch = require('./semantic/tasks/watch'),
	sem_build = require('./semantic/tasks/build');

gulp.task("watch-ui", sem_watch);
gulp.task("build-ui", sem_build);

gulp.task("build-client", () => {
	var comp = file =>
		browserify("client/" + file)
		.bundle()
		.pipe(source(file))
		.pipe(streamify(uglify()))
		.pipe(gulp.dest("front/"));

	comp("fcauth.js");
	comp("vcent.js");
});

gulp.task("build", [ "build-client", "build-ui" ]);

gulp.task("watch", [ "watch-ui" ]);
gulp.task("default", [ "build" ]);
