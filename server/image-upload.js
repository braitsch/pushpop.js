
var opts;
var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });
var guid = function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}

var gCloud;
var Busboy = require('busboy');

exports.settings = function(obj)
{
	opts = obj;	
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
	if (req.body.type == 'video'){
		req.video = { 'url' : req.body.url, 'preview' : req.body.preview };
		next();
	}	else {
		var busboy = new Busboy({ headers: req.headers });
		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			req.image = { name : getFileName(filename), type : getFileType(filename) };
			var fstream = fs.createWriteStream(opts.local + '/' + req.image.name + req.image.type);
			file.pipe(fstream);
		});
		var tdata;
		busboy.on('field', function(key, value, fieldnameTruncated, valTruncated, encoding, mimetype) {
			if (key == 'thumb' && value != '') {
				tdata = JSON.parse(value);
			}	else if (key == 'caption' && value != '') {
				//image.caption = value;
			}
		});
		busboy.on('finish', function() {
			log('file received');
			if (tdata == undefined){
				if (gCloud == undefined){
					next();	
				}	else{
					saveToGoogleCloud(req, next);
				}
			}	else{
				saveThumb(tdata, req, function(){
					if (gCloud == undefined){
						next();	
					}	else{
						saveToGoogleCloud(req, next);
					}
				})
			}
		});
		req.pipe(busboy);
	}
}

var saveThumb = function(tdata, req, cback)
{
	log('generating thumbnail', tdata);
	var img = gm(opts.local + '/' + req.image.name + req.image.type);
	img.crop(tdata.crop.w, tdata.crop.h, tdata.crop.x, tdata.crop.y);
// do not resize if we did not explicitly receive a width & height value //
	if (tdata.width != 0 && tdata.height != 0) img.resize(tdata.width, tdata.height, '!');
	img.noProfile();
	img.write(opts.local + '/' + req.image.name + '_thumb'+ req.image.type, cback);
}

exports.delete = function(filename, cback)
{
//	var result = { };
}

exports.listFiles = function(directory, cback)
{
	gCloud.listFiles(getRemotePath(directory), cback);
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
	var large = req.image.name + req.image.type;
	var thumb = req.image.name + '_thumb'+ req.image.type;
	gCloud.uploadImage(opts.local + '/' + large, opts.remote + large, function(e){
		if (e){
			log('error transferring file to gcloud', e);
			cback();
		}	else{
			fs.unlinkSync(opts.local + '/' + large);
			log('large file uploaded to gcloud');
			if (fs.existsSync(opts.local + '/' + thumb) == false) {
				cback();
			}	else{
				gCloud.uploadImage(opts.local + '/' + thumb, opts.remote + thumb, function(e){
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

