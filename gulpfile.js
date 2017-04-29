var browserify = require("browserify");
var streamify = require("gulp-streamify");
var source = require("vinyl-source-stream");
var uglify = require("gulp-uglify");
var gulp = require("gulp");
var del = require("del");

var
	sem_watch = require('./semantic/tasks/watch'),
	sem_build = require('./semantic/tasks/build');

gulp.task("del-site", () => {
	return del([ "semantic/src/site/**/*" ]);
});

gulp.task("apply-site", [ "del-site" ], () => {
	return gulp.src("theme/**/*").pipe(gulp.dest("semantic/src/site"));
});

gulp.task("watch-ui", [ "apply-site" ], sem_watch);
gulp.task("build-ui", [ "apply-site" ], sem_build);

gulp.task("build-client", () => {
	var comp = file =>
		browserify("client/" + file)
		.bundle()
		.pipe(source(file))
		.pipe(streamify(uglify()))
		.pipe(gulp.dest("front/lib"));

	comp("foci.js");
	comp("vcent.js");
});

gulp.task("build", [ "build-client", "build-ui" ]);

gulp.task("watch", [ "watch-ui" ]);
gulp.task("default", [ "build" ]);
