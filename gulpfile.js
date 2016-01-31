"use strict";

const gulp = require("gulp");
const shell = require("gulp-shell");

gulp.task("build", shell.task("tsc --pretty"));

gulp.task("deploy", shell.task("tsc --pretty"));

gulp.task("host", shell.task("node app.js"));
