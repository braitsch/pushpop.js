
var gulp = require('gulp'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	minifyCSS = require('gulp-minify-css');

gulp.task('js', function(){
	return gulp.src('./public/javascripts/pushpop.js')
		.pipe(uglify())
		.pipe(rename({ suffix: '.min'}))
		.pipe(gulp.dest('./public/javascripts/'));
});	

gulp.task('css', function(){
	return gulp.src('./public/css/pushpop.css')
		.pipe(minifyCSS())
		.pipe(rename({ suffix: '.min'}))
		.pipe(gulp.dest('./public/css/'));
});	

gulp.task('js-all', function(){
	var dir = './public/javascripts/';
	return gulp.src([ 
			dir+'bootstrap.min.js',
			dir+'jquery-2.1.4.min.js',
			dir+'jquery-form.min.js',
			dir+'pushpop.js'
		])
		.pipe(concat('pushpop.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('./public/javascripts'));
});

gulp.task('css-all', function(){
	var dir = './public/css/';
	return gulp.src([ 
			dir+'bootstrap.min.css',
			dir+'pushpop.css'
		])
		.pipe(concat('pushpop.min.css'))
		.pipe(minifyCSS())
		.pipe(gulp.dest('./public/css'));
});

gulp.task('pushpop', ['js', 'css']);
gulp.task('pushpop-all', ['js-all', 'css-all']);


