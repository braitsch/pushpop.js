
/*
    Copyright (C) 2016 Stephen Braitsch [http://braitsch.io]
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });
var path = require('path');
var exec = require('child_process').exec;
var Busboy = require('busboy');
var guid = function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}

var db, service, settings = { pName : 'gallery'};

/*
	configuration
*/

exports.config = function(flags)
{
	settings.uploads = flags.uploads;
	ensureDirectoryExists(settings.uploads);
	settings.uniqueIds = flags.uniqueIds || true;
	settings.enableLogs = flags.enableLogs || true;
	if (flags.service){
		service_name = flags.service.name.toLowerCase();
		if (service_name == 'gcloud'){
			service = require('./services/gcloud')(flags.service.bucket, log);
		}	else{
			log('local :: unknown service : ', flags.service.name);
		}
	}
	db = require('./dbs/mongo')(log);
	settings.pDirectory = settings.uploads + '/' + settings.pName;
}

/*
	get & set the active project
*/

exports.setProject = function(pName, cback)
{
	settings.pName = pName;
// update the local upload destination //
	settings.pDirectory = settings.uploads + '/' + settings.pName;
// and always ensure directory exists before we attempt to write to it //
	ensureDirectoryExists(settings.pDirectory);
// get the requested project from the database //
	db.getMediaInProject(pName, cback);
}

exports.getProject = function(pName, cback)
{
	db.getMediaInProject(pName, cback);
}

exports.getAll = function(cback)
{
	db.getAll(cback);
}

/*
	media upload & delete
*/

exports.upload = function(req, res, next)
{
	req.media = {};
	var busboy = new Busboy({ headers: req.headers });
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		var name = getFileName(filename);
		var type = getFileType(filename);
		req.media.type = 'image';
		req.media.host = '';
		req.media.project = settings.pName;
		req.media.image = name + type;
		req.media.preview = name + '_sm' + type;
		ensureDirectoryExists(settings.pDirectory);
		var fstream = fs.createWriteStream(settings.pDirectory + '/' + req.media.image);
		file.pipe(fstream);
	});
	var fields = {};
	busboy.on('field', function(key, value, fieldnameTruncated, valTruncated, encoding, mimetype) {
		fields[key] = value;
	});
	busboy.on('finish', function() {
		if (fields.type == 'video'){
			req.media.type = 'video';
			req.media.project = settings.pName;
			req.media.video = fields.url;
			req.media.preview = fields.preview;
			addMedia(req, next);
		}	else if (fields.type == 'image'){
			if (fields.thumb == undefined){
				if (service == undefined){
					addMedia(req, next);
				}	else{
					saveToCloudService(req, next);
				}
			}	else{
				saveThumb(JSON.parse(fields.thumb), req, function(){
					if (service == undefined){
						addMedia(req, next);
					}	else{
						saveToCloudService(req, next);
					}
				})
			}
		}
	});
	req.pipe(busboy);
}

exports.delete = function(req, res, next)
{
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};
	busboy.on('field', function(key, value, fieldnameTruncated, valTruncated, encoding, mimetype) {
		fields[key] = value;
	});
	busboy.on('finish', function() {
		delMedia(fields.id, next);
	});
	req.pipe(busboy);
}

exports.reset = function(cback)
{
	db.reset(function(){
		if (service){
	// delete everything in the bucket //
			service.delete('', cback)
		}	else{
			log('local :: wiping all local files');
			var files = fs.readdirSync(settings.uploads);
			if (files.length > 0){
				for (var i = 0; i < files.length; i++) {
					var filePath = settings.uploads + '/' + files[i];
					if (fs.statSync(filePath).isFile()){
						fs.unlinkSync(filePath);
					}	else{
						exec('rm -rf '+filePath, function ( err, stdout, stderr ){ });
					}
				}
			}
			cback();
		}
	});
}

/*
	internal methods 
*/

var saveThumb = function(tdata, req, cback)
{
	log('local :: generating thumbnail');
	var img = gm(settings.pDirectory + '/' + req.media.image);
	img.crop(tdata.crop.w, tdata.crop.h, tdata.crop.x, tdata.crop.y);
// do not resize if we did not explicitly receive a width & height value //
	if (tdata.width != 0 && tdata.height != 0) img.resize(tdata.width, tdata.height, '!');
	img.noProfile();
	img.write(settings.pDirectory + '/' + req.media.preview, cback);
}

var addMedia = function(req, next)
{
	db.save(req.media, next);
}

var delMedia = function(id, next)
{	
	db.getMediaById(id, function(media){
// ensure asset still exists before we attempt to delete it //
		if (media == undefined){
			next();
		}	else{
			if (media.type == 'image'){
				if (media.host == ''){
					log('local :: deleting from local filesystem:', media.image);
					fs.unlinkSync(settings.uploads +'/'+ settings.pName +'/'+ media.image);
					fs.unlinkSync(settings.uploads +'/'+ settings.pName +'/'+ media.preview);
				}	else if (service) {
					var name = media.image.substr(0, media.image.lastIndexOf('.'));
					service.delete(settings.pName + '/'+ name, function(){  });
				}
			}
			db.delete(id, next);
		}
	});
}

var saveToCloudService = function(req, next)
{
	req.media.host = service.getURL();
	service.upload(settings.pDirectory + '/' + req.media.image, settings.pName + '/' + req.media.image, function(e){
		if (e){
			log('local :: error transferring file to service', e);
			addMedia(req, next);
		}	else{
			log('local :: large file uploaded to service');
			fs.unlinkSync(settings.pDirectory + '/' + req.media.image);
			if (fs.existsSync(settings.pDirectory + '/' + req.media.preview) == false) {
				addMedia(req, next);
			}	else{
				service.upload(settings.pDirectory + '/' + req.media.preview, settings.pName + '/' + req.media.preview, function(e){
					if (e){
						log('local :: error transferring file to service', e);
						addMedia(req, next);
					}	else{
						fs.unlinkSync(settings.pDirectory + '/' + req.media.preview);
						log('local :: thumb file uploaded to service');
						addMedia(req, next);
					}
				});
			}
		}
	});
}

var getFileName = function(name)
{
	if (settings.uniqueIds == true){
		return guid();
	}	else{
		return name.substr(0, name.lastIndexOf('.')).toLowerCase().replace(/\s/g, '_');
	}
}

var getFileType = function(name)
{
	return name.substr(name.lastIndexOf('.'));
}

var ensureDirectoryExists = function(dir)
{
	if (!fs.existsSync(dir)) { log('local :: creating directory', dir); fs.mkdirSync(dir); }
}

var log = function()
{
	var str = '';
	for(p in arguments) str += arguments[p] + ' ';
	if (settings.enableLogs) console.log('[ pushpop –– ' + str + ' ]');
}

/*
	aux method to delete files older than a certain age
*/

exports.purge = function(maxAge)
{
	var empty = function(pName, index){
		delMedia('*', check);
	}
	var check = function(){
		var now = new Date().getTime();
		var exp = ((1000 * 60) * maxAge);
		db.getAll(function(projects){
			for(var i = projects.length - 1; i >= 0; i--) {
				var p = projects[i];
				for (var j=0; j<p.media.length; j++) {
					var age = (now - p.media[j].date.getTime());
					if (age > exp) {
						empty(p.name, j); return;
					}
				}
			}
		});
	}
	check();
}
