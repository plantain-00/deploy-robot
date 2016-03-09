"use strict";

const gulp = require("gulp");
const shell = require("gulp-shell");
const tslint = require("gulp-tslint");

gulp.task("tslint", () => {
    return gulp.src(["*.ts"])
        .pipe(tslint({
            tslint: require("tslint")
        }))
        .pipe(tslint.report("prose", { emitError: true }));
});

gulp.task("build", shell.task("tsc --pretty && gulp tslint"));

gulp.task("deploy", shell.task("tsc --pretty && gulp tslint"));

gulp.task("host", shell.task("node robot.js"));
