'use strict';

var gulp = require('gulp');

var amdOptimize = require("amd-optimize");
var amdclean = require('gulp-amdclean');
var concat = require('gulp-concat');
var uglyfly = require('gulp-uglyfly');
var rename = require("gulp-rename");
var rm = require('gulp-rm');
var wrap = require("gulp-wrap");
var fs = require('fs');
var replace = require('gulp-replace');
var lintAll = require('gulp-lint-everything')({jshint: ".jshintrc"});


gulp.task("default", ["demo:sync"], function () {});

gulp.task("scripts:lint", function () {
    return lintAll("./src/**/*.js");
});

gulp.task("scripts:build-legcy", ["scripts:lint"], function () {
    return gulp.src("./src/xStorage-1.0.js")
        .pipe(concat("xStorage.js"))
        .pipe(amdOptimize("xStorage"))
        .pipe(amdclean.gulp({"prefixMode": "standard"}))
        .pipe(replace(/^;\(function\(\) \{\n/, ""))
        .pipe(replace(/\n\}\(\)\);$/, ""))
        .pipe(wrap(fs.readFileSync("./.build-wrapper.tpl", "utf8")))
        .pipe(concat("xStorage-1.0.js"))
        .pipe(gulp.dest("./dist"))
        .pipe(uglyfly())
        .pipe(concat("xStorage-1.0.min.js"))
        .pipe(gulp.dest("./dist"));
});

gulp.task("scripts:build-trunk", ["scripts:lint"],function () {
    return gulp.src("./src/xStorage-2.0.js")
        .pipe(concat("xStorage.js"))
        .pipe(amdOptimize("xStorage"))
        .pipe(amdclean.gulp({"prefixMode": "standard"}))
        .pipe(replace(/^;\(function\(\) \{\n/, ""))
        .pipe(replace(/\n\}\(\)\);$/, ""))
        .pipe(wrap(fs.readFileSync("./.build-wrapper.tpl", "utf8")))
        .pipe(concat("xStorage-2.0.js"))
        .pipe(gulp.dest("./dist"))
        .pipe(uglyfly())
        .pipe(concat("xStorage-2.0.min.js"))
        .pipe(gulp.dest("./dist"));
})

gulp.task("test:sync", ["scripts:build-trunk", "scripts:build-legcy"], function () {
    return gulp.src("./dist/xStorage-1.0.min.js")
            .pipe(gulp.dest("./tests/dist")) &&
        gulp.src("./dist/xStorage-2.0.min.js")
            .pipe(gulp.dest("./tests/dist"));

});

gulp.task("demo:sync", ["test:sync"], function () {
    return gulp.src("./dist/xStorage-1.0.min.js")
            .pipe(gulp.dest("./demo/dist")) &&
        gulp.src("./dist/xStorage-2.0.min.js")
            .pipe(gulp.dest("./demo/dist"));
});

gulp.task("test:mocha", ["test:sync"], function () {
    return gulp
        .src("./tests/phantomjs.html")
        .pipe(mochaPhantomJS());
});