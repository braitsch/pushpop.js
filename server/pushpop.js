
var opts;
var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });
var path = require('path');
var exec = require('child_process').exec;
var guid = function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}
var Busboy = require('busboy');

var gCloud;
// use mongodb as default datastore //
var db = require('./mongo');

/*
	public methods
*/

exports.settings = function(obj)
{
	opts = obj;
	opts.local = path.join(__dirname, '..', obj.local);
}

exports.set = function(pName, cback)
{
	opts.pName = pName;
// update the local upload destination //
	opts.pdir = opts.local + '/' + opts.pName;
// and always ensure it actually exists //
	if (!fs.existsSync(opts.pdir)) fs.mkdirSync(opts.pdir);
// get the requested project from the database //
	db.getProjectByName(pName, cback);
}

exports.get = function(pName, cback)
{
	db.getProjectByName(pName, cback);
}

exports.getAll = function(cback)
{
	db.getAllProjects(cback);
}

exports.use = function(service, bucket)
{
	if (service == 'gcloud'){
		gCloud = require('./gcloud')(bucket);
	}	else{
		log('unknown cloud service requested');
	}
}

exports.upload = function(req, res, next)
{
	req.media = {};
	var busboy = new Busboy({ headers: req.headers });
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		req.media.type = 'image';
		req.media.name = getFileName(filename);
		req.media.ext = getFileType(filename);
		req.media.host = ''; // default to localhost //
		var fstream = fs.createWriteStream(opts.pdir + '/' + req.media.name + req.media.ext);
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
			saveToDatabase(req, next);
			return;
		}	else if (fields.type == 'image'){
			if (fields.thumb == undefined){
				if (gCloud == undefined){
					saveToDatabase(req, next);
				}	else{
					saveToGoogleCloud(req, next);
				}
			}	else{
				saveThumb(JSON.parse(fields.thumb), req, function(){
					if (gCloud == undefined){
						saveToDatabase(req, next);
					}	else{
						saveToGoogleCloud(req, next);
					}
				})
			}
		}
	});
	req.pipe(busboy);
}

exports.reset = function(cback)
{
	log('wiping datastore');
	db.wipe(function(){
		if (gCloud){
			log('wiping gcloud');
			gCloud.delete(opts.pName, cback)
		}	else{
			log('wiping local files');
			var files = fs.readdirSync(opts.local);
			if (files.length > 0){
				for (var i = 0; i < files.length; i++) {
					var filePath = opts.local + '/' + files[i];
					if (fs.statSync(filePath).isFile()){
						fs.unlinkSync(filePath);
					}	else{
						exec('rm -rf' + filePath, function ( err, stdout, stderr ){ });
					}
				}
			}
			cback();
		}
	});
}

var saveThumb = function(tdata, req, cback)
{
	log('generating thumbnail');
	var img = gm(opts.pdir + '/' + req.media.name + req.media.ext);
	img.crop(tdata.crop.w, tdata.crop.h, tdata.crop.x, tdata.crop.y);
// do not resize if we did not explicitly receive a width & height value //
	if (tdata.width != 0 && tdata.height != 0) img.resize(tdata.width, tdata.height, '!');
	img.noProfile();
	img.write(opts.pdir + '/' + req.media.name + '_thumb'+ req.media.ext, cback);
}

var saveToDatabase = function(req, next)
{
	db.addMediaToProject(opts.pName, req.media, next);
}

var saveToGoogleCloud = function(req, next)
{
	log('uploading to google cloud');
	req.media.host = gCloud.getURL();
	var large = req.media.name + req.media.ext;
	var thumb = req.media.name + '_thumb' + req.media.ext;
	gCloud.upload(opts.pdir + '/' + large, opts.pName + '/' + large, function(e){
		if (e){
			log('error transferring file to gcloud', e);
			saveToDatabase(req, next);
		}	else{
			fs.unlinkSync(opts.pdir + '/' + large);
			log('large file uploaded to gcloud');
			if (fs.existsSync(opts.pdir + '/' + thumb) == false) {
				saveToDatabase(req, next);
			}	else{
				gCloud.upload(opts.pdir + '/' + thumb, opts.pName + '/' + thumb, function(e){
					if (e){
						log('error transferring file to gcloud', e);
						saveToDatabase(req, next);
					}	else{
						fs.unlinkSync(opts.pdir + '/' + thumb);
						log('thumb file uploaded to gcloud');
						saveToDatabase(req, next);
					}
				});
			}
		}
	});
}

/*
	internal helpers
*/

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
	if (opts.verbose) console.log('[ pushpop –– ' + str + ' ]');
}

// var getRemotePath = function(str)
// {
// 	if (!str) {
// 		str = '';
// 	}	else {
// 	// trim off leading slash //
// 		if (str.indexOf('/') == 0) {
// 			str = str.substr(1);
// 		}
// 	// append trailing slash if missing //
// 		if (str.lastIndexOf('/') != str.length - 1){
// 			str += '/';
// 		}
// 	}
// 	return str;
// }

// exports.listFiles = function(cback)
// {
// 	if (gCloud){
// 		gCloud.listFiles(opts.remote, cback);
// 	}	else{
// 		var a = [];
// 		fs.readdir(opts.local, function (e, files) {
// 			if (e) {
// 				log('error reading local upload directory');
// 				cback(a);
// 			}	else{
// 				files.forEach(function (name) { 
// 					if (name.indexOf('.') != 0 && name.search('_thumb') != -1) {
// 						a.push({ path : name}); 
// 					}
// 				});
// 				cback(a);
// 			}
// 		});
// 	}
// }

