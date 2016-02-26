
var opts;
var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });
var path = require('path');
var guid = function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}

var gCloud;
var Busboy = require('busboy');

exports.settings = function(obj)
{
	opts = obj;
// make local upload directory relative to root //
	opts.local = path.join(__dirname, '..', obj.local);
	opts.remote = getRemotePath(obj.remote);
// ensure local upload directory exists //
	if (!fs.existsSync(obj.local)) fs.mkdirSync(obj.local);
}

exports.gcloud = function(bucket, directory)
{
	gCloud = require('./gcloud')(bucket);
	opts.remote = getRemotePath(directory);
}

exports.remote = function(dest)
{
	opts.remote = getRemotePath(dest);
}

exports.upload = function(req, res, next)
{
	req.media = {};
	var busboy = new Busboy({ headers: req.headers });
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		req.media.type = 'image';
		req.media.ext = getFileType(filename);
		req.media.name = getFileName(filename);
		req.media.path = gCloud ? gCloud.getURL() : '';
		var fstream = fs.createWriteStream(opts.local + '/' + req.media.name + req.media.ext);
		file.pipe(fstream);
	});
	var fields = {};
	busboy.on('field', function(key, value, fieldnameTruncated, valTruncated, encoding, mimetype) {
		fields[key] = value;
	});
	busboy.on('finish', function() {
		log('file received');
		if (fields.type == 'video'){
			req.media.type = 'video';
			req.media.url = fields.url;
			req.media.preview = fields.preview;
			next();
			return;
		}	else if (fields.type == 'image'){
			if (fields.thumb == undefined){
				if (gCloud == undefined){
					next();	
				}	else{
					saveToGoogleCloud(req, next);
				}
			}	else{
				saveThumb(JSON.parse(fields.thumb), req, function(){
					if (gCloud == undefined){
						next();	
					}	else{
						saveToGoogleCloud(req, next);
					}
				})
			}
		}
	});
	req.pipe(busboy);
}

exports.wipe = function(cback)
{
	if (gCloud){
		console.log('wiping gcloud');
		gCloud.delete(opts.remote, cback)
	}	else{
		console.log('wiping local files');
		var files = fs.readdirSync(opts.local);
		if (files.length > 0){
			for (var i = 0; i < files.length; i++) {
				var filePath = opts.local + '/' + files[i];
				if (fs.statSync(filePath).isFile()){
					fs.unlinkSync(filePath);
				}
			}
		}
		cback();
	}
}

exports.listFiles = function(cback)
{
	if (gCloud){
		gCloud.listFiles(opts.remote, cback);
	}	else{
		var a = [];
		fs.readdir(opts.local, function (e, files) {
			if (e) {
				log('error reading local upload directory');
				cback(a);
			}	else{
				files.forEach(function (name) { 
					if (name.indexOf('.') != 0 && name.search('_thumb') != -1) {
						a.push({ path : name}); 
					}
				});
				cback(a);
			}
		});
	}
}

var saveThumb = function(tdata, req, cback)
{
	log('generating thumbnail', tdata);
	var img = gm(opts.local + '/' + req.media.name + req.media.ext);
	img.crop(tdata.crop.w, tdata.crop.h, tdata.crop.x, tdata.crop.y);
// do not resize if we did not explicitly receive a width & height value //
	if (tdata.width != 0 && tdata.height != 0) img.resize(tdata.width, tdata.height, '!');
	img.noProfile();
	img.write(opts.local + '/' + req.media.name + '_thumb'+ req.media.ext, cback);
}

var getFileName = function(name)
{
	if (opts.guid == true){
		return guid();
	}	else{
		return name.substr(0, name.lastIndexOf('.')).toLowerCase().replace(/\s/g, '_');
	}
}

var getFileType = function(name)
{
	return name.substr(name.lastIndexOf('.'));
}

var log = function()
{
	var str = '';
	for(p in arguments) str += arguments[p] + ' ';
	if (opts.verbose) console.log('[ image uploader –– ' + str + ' ]');
}

var saveToGoogleCloud = function(req, cback)
{
	log('uploading to google cloud');
	var large = req.media.name + req.media.ext;
	var thumb = req.media.name + '_thumb'+ req.media.ext;
	gCloud.upload(opts.local + '/' + large, opts.remote + large, function(e){
		if (e){
			log('error transferring file to gcloud', e);
			cback();
		}	else{
			fs.unlinkSync(opts.local + '/' + large);
			log('large file uploaded to gcloud');
			if (fs.existsSync(opts.local + '/' + thumb) == false) {
				cback();
			}	else{
				gCloud.upload(opts.local + '/' + thumb, opts.remote + thumb, function(e){
					if (e){
						log('error transferring file to gcloud', e);
						cback();
					}	else{
						fs.unlinkSync(opts.local + '/' + thumb);
						log('thumb file uploaded to gcloud');
						cback();
					}
				});
			}
		}
	});
}

var getRemotePath = function(str)
{
	if (!str) {
		str = '';
	}	else {
	// trim off leading slash //
		if (str.indexOf('/') == 0) {
			str = str.substr(1);
		}
	// append trailing slash if missing //
		if (str.lastIndexOf('/') != str.length - 1){
			str += '/';
		}
	}
	return str;
}

