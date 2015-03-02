'use strict';

var gulp = require('gulp');
var cjs = require('gulp-cjs');

var excludes = [
  // 'wunderbits.core',
  'ws',
  'xmlhttprequest'
];

// load tasks
gulp.task('scripts', cjs.scripts(gulp, {
  'excludes': excludes,
  'sourceDir': 'public',
  'destDir': 'dist',
  'name': 'wunderlist.sdk'
}));

gulp.task('server', cjs.server(gulp, {
  'port': 5030,
  'baseDir': process.cwd(),
  'files': require('./karma/files')
}));

gulp.task('tests/unit', cjs.tests(gulp, {
  'name': 'unit',
  'excludes': excludes,
  'pattern': 'tests/unit/**/*.spec.js',
  'baseDir': process.cwd(),
  'destDir': 'build'
}));

gulp.task('tests', ['tests/unit']);
gulp.task('watch', function () {
  gulp.watch([
    'tests/**/*.spec.js',
    'public/**/*.js'
  ], ['tests']);
});