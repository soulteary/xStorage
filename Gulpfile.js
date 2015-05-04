var gulp = require('gulp');

var amdOptimize = require("amd-optimize");
var concat = require('gulp-concat');
var cmd = require('gulp-cmd');
var path = require('path');
var uglify = require('gulp-uglify');
var mochaPhantomJS = require('gulp-mocha-phantomjs');

gulp.task('default', ['build']);
gulp.task("build", ["scripts:build", "scripts:build-cmd"], function () {});

gulp.task("scripts:build", function () {
    return gulp.src("./src/xStorage.js")
        .pipe(amdOptimize("xStorage", {wrapShim: true}))
        .pipe(concat("xStorage.js"))
        .pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(concat("xStorage.min.js"))
        .pipe(gulp.dest("dist"));
});

gulp.task("scripts:build-cmd", function () {
    return gulp.src("./src/xStorage.js")
        .pipe(cmd())
        .pipe(concat("xStorage.cmd.js"))
        .pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(concat("xStorage.cmd.min.js"))
        .pipe(gulp.dest("dist"));
});

gulp.task("demo:sync", ["scripts:build", "scripts:build-cmd"], function () {
    return gulp.src("./dist/xStorage.min.js")
            .pipe(gulp.dest("./demo/dist"))
        && gulp.src("./dist/xStorage.cmd.min.js")
            .pipe(gulp.dest("./demo/dist"));
});

gulp.task("test:sync", ["scripts:build"], function () {
    return gulp.src("./dist/xStorage.min.js")
            .pipe(gulp.dest("tests/dist"))
        && gulp.src("./dist/xStorage.cmd.min.js")
            .pipe(gulp.dest("./tests/dist"));
});

gulp.task("test:mocha", ["test:sync"], function () {
    return gulp
        .src("./test/phantomjs.html")
        .pipe(mochaPhantomJS());
});