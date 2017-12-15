"use strict";
const gulp = require("gulp");
const concat = require("gulp-concat");
const babel = require("gulp-babel");
const path = require("path");


const BABEL_SETTINGS = {
	comments: false,
	compact: true,
	presets: ["env"]
};

gulp.task("compile_js", () => {
	let commonJs = gulp.src("./src/**/*.js")
	.pipe(babel(BABEL_SETTINGS))
	.pipe(concat("algae.js"))
	.pipe(gulp.dest("./dist/"));
});


gulp.task("watch", () => {
	gulp.watch("./src/**/*.js", ["compile_js"]);
});


gulp.task("compile", ["compile_js"]);
gulp.task("default", ["compile", "watch"]);
