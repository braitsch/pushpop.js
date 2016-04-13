
var gulp = require('gulp'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	minifyCSS = require('gulp-minify-css');

gulp.task('site-js', function(){
	var dir = './public';
	return gulp.src([ 
			dir+'/vendor/jquery-2.1.4.min.js',
			dir+'/vendor/bootstrap.min.js',
			dir+'/vendor/jquery.form.min.js',
			dir+'/javascripts/pushpop.js'
		])
		.pipe(concat('pushpop.js'))
		.pipe(uglify())
		.pipe(gulp.dest('../demo-empty/public'));
});

gulp.task('site-css', function(){
	var dir = './public/';
	return gulp.src([ 
			dir+'/vendor/bootstrap.min.css',
			dir+'/css/pushpop.css'
		])
		.pipe(concat('pushpop.css'))
		.pipe(minifyCSS())
		.pipe(gulp.dest('../demo-empty/public'));
});

gulp.task('site', ['site-js', 'site-css']);