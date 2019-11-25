// Load plugins
const gulp = require("gulp");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const sourcemaps = require("gulp-sourcemaps");
const include = require("gulp-include");
const browser = require('browser-sync').create();
const fileinclude = require("gulp-file-include");


// personally written Javascript
var jsFiles = [
  'dev/js/**/*.js'
];

// personally written sass
var cssFiles = [
  'dev/sass/**/*.sass'
];

// CSS task -> sass to css
gulp.task('css', function() {
  return gulp
    .src("dev/sass/*.sass")
    .pipe(sass({ outputStyle: "nested" }))
    .pipe(gulp.dest("public/css/"));

});

// put the js in the public folder
gulp.task('scripts', function() {
  return gulp
      .src(["dev/js/**/*.js"])
      .pipe(gulp.dest("public/js/"));
});

// put the html in the public folder
gulp.task('moveHtml', function() {
  return gulp
    .src(['dev/*.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest("public/"));
});

// open browser and load site
// Watches files for changes and reload browser
gulp.task('browser', function() {
  browser.init({
    server: 'public/',
    port: 3000,
  });
  // Reload when js changes
  gulp.watch(jsFiles, gulp.parallel('scripts'))
    .on('change', browser.reload);

  // Reload when css changes
  gulp.watch(cssFiles, gulp.parallel('css'))
    .on('change', browser.reload);

  // Reload when html changes
  gulp.watch('dev/**/*.html', gulp.parallel('moveHtml'))
    .on('change', browser.reload);


});

// build
gulp.task('serve', gulp.parallel('css', 'scripts', 'moveHtml', 'browser'));
gulp.task('default', gulp.series('serve'));
