var gulp = require('gulp');

var amdOptimize = require("amd-optimize");
var concat = require('gulp-concat');
var cmd = require('gulp-cmd');
var path = require('path');
var uglify = require('gulp-uglify');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var rm = require('gulp-rm');

var config = {
    legcy: {
        src    : "xStorage-1.0.js",
        dist   : "xStorage-1.0.min.js",
        cmdSrc : "xStorage-1.0.cmd.js",
        cmdDist: "xStorage-1.0.cmd.min.js"

    },
    trunk: {
        src    : "xStorage-2.0.js",
        dist   : "xStorage-2.0.min.js",
        cmdSrc : "xStorage-2.0.cmd.js",
        cmdDist: "xStorage-2.0.cmd.min.js"
    },
    tmp  : {
        src: "xStorage"
    }
};


gulp.task("default", ["clean:tmp"]);

gulp.task("scripts:sync-tmp-legcy", function () {
    return gulp.src("./src/" + config.legcy.src)
        .pipe(concat(config.tmp.src + ".js"))
        .pipe(gulp.dest("tmp"));
})
gulp.task("scripts:build-legcy", ["scripts:sync-tmp-legcy"], function () {
    return gulp.src("./tmp/" + config.tmp.src + ".js")
        .pipe(amdOptimize(config.tmp.src, {wrapShim: true}))
        .pipe(concat(config.legcy.src))
        .pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(concat(config.legcy.dist))
        .pipe(gulp.dest("dist"));
});
gulp.task("scripts:build-cmd-legcy", ["scripts:build-legcy"], function () {
    return gulp.src("./tmp/" + config.tmp.src + ".js")
        .pipe(cmd())
        .pipe(concat(config.legcy.cmdSrc))
        .pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(concat(config.legcy.cmdDist))
        .pipe(gulp.dest("dist"));
});
gulp.task("scripts:sync-tmp-trunk", ["scripts:build-cmd-legcy"], function () {
    return gulp.src("./src/" + config.trunk.src)
        .pipe(concat(config.tmp.src + ".js"))
        .pipe(gulp.dest("tmp"));
})
gulp.task("scripts:build-trunk", ["scripts:sync-tmp-trunk"], function () {
    return gulp.src("./tmp/" + config.tmp.src + ".js")
        .pipe(amdOptimize(config.tmp.src, {wrapShim: true}))
        .pipe(concat(config.trunk.src))
        .pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(concat(config.trunk.dist))
        .pipe(gulp.dest("dist"));
});
gulp.task("scripts:build-cmd-trunk", ["scripts:build-trunk"], function () {
    return gulp.src("./tmp/" + config.tmp.src + ".js")
        .pipe(cmd())
        .pipe(concat(config.trunk.cmdSrc))
        .pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(concat(config.trunk.cmdDist))
        .pipe(gulp.dest("dist"));
});

gulp.task("clean:tmp", ["scripts:build-cmd-trunk"], function () {
    return gulp.src("./tmp/**/*", {read: true})
        .pipe(rm({async: false}))
})


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