
var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });
var path = require('path');
var exec = require('child_process').exec;
var Busboy = require('busboy');
var guid = function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}

var db, service;
var settings = {
	uniqueIds:true,
	verboseLogs:false,
	uploads:'uploads',
	pName:'my-project',
}

/*
	setup methods 
*/

exports.uniqueIds = function(ok)
{
	settings.uniqueIds = ok;
}

exports.verboseLogs = function(ok)
{
	settings.verboseLogs = ok;
}

exports.uploadTo = function(dir)
{
	settings.uploads = dir;
	settings.uploads = path.join(__dirname, '..', settings.uploads);
	checkDirectoryExists(settings.uploads);
}

exports.database = function(db_name)
{
	db_name = db_name.toLowerCase();
	if (db_name == 'mongo'){
		db = require('./stores/dbs/mongo')(log);
	}	else{
		log('local :: unknown database : ', db_name);
	}
}

exports.service = function(service_name, bucket)
{
	service_name = service_name.toLowerCase();
	if (service_name == 'gcloud'){
		service = require('./stores/services/gcloud')(bucket, log);
	}	else{
		log('local :: unknown service : ', service_name);
	}
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
	checkDirectoryExists(settings.pDirectory);
// get the requested project from the database //
	db.get(pName, cback);
}

exports.getProject = function(pName, cback)
{
	db.get(pName, cback);
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
		req.media.type = 'image';
		req.media.name = getFileName(filename);
		req.media.ext = getFileType(filename);
		var fstream = fs.createWriteStream(settings.pDirectory + '/' + req.media.name + req.media.ext);
		file.pipe(fstream);
	});
	var fields = {};
	busboy.on('field', function(key, value, fieldnameTruncated, valTruncated, encoding, mimetype) {
		fields[key] = value;
	});
	busboy.on('finish', function() {
		if (fields.type == 'video'){
			req.media.type = 'video';
			req.media.url = fields.url;
			req.media.preview = fields.preview;
			addMediaToProject(req, next);
			return;
		}	else if (fields.type == 'image'){
			if (fields.thumb == undefined){
				if (service == undefined){
					addMediaToProject(req, next);
				}	else{
					saveToCloudService(req, next);
				}
			}	else{
				saveThumb(JSON.parse(fields.thumb), req, function(){
					if (service == undefined){
						addMediaToProject(req, next);
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
		delMediaFromProject(fields.pname, fields.index, next);
	});
	req.pipe(busboy);
}

exports.reset = function(cback)
{
	db.reset(function(){
		if (service){
			service.delete(settings.pName, cback)
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
	var img = gm(settings.pDirectory + '/' + req.media.name + req.media.ext);
	img.crop(tdata.crop.w, tdata.crop.h, tdata.crop.x, tdata.crop.y);
// do not resize if we did not explicitly receive a width & height value //
	if (tdata.width != 0 && tdata.height != 0) img.resize(tdata.width, tdata.height, '!');
	img.noProfile();
	img.write(settings.pDirectory + '/' + req.media.name + '_thumb'+ req.media.ext, cback);
}

var addMediaToProject = function(req, next)
{
	db.get(settings.pName, function(project){
		project.media.push(req.media);
		project.last_updated = new Date();
		db.save(project, next);
	});
}

var delMediaFromProject = function(pName, index, next)
{
	db.get(pName, function(project){
		var asset = project.media[index];
		if (asset.type == 'image'){
			var large = asset.name + asset.ext;
			var thumb = asset.name + '_thumb' + asset.ext;
			if (!asset.host){
				log('local :: deleting from local filesystem:', large);
				fs.unlinkSync(settings.uploads +'/'+ project.name +'/'+ large);
				fs.unlinkSync(settings.uploads +'/'+ project.name +'/'+ thumb);
			}	else if (service) {
				service.delete(project.name + '/'+ asset.name, function(){  });
			}
		}
		project.media.splice(index, 1);
		db.save(project, next);
	});
}

var saveToCloudService = function(req, next)
{
	req.media.host = service.getURL();
	var large = req.media.name + req.media.ext;
	var thumb = req.media.name + '_thumb' + req.media.ext;
	service.upload(settings.pDirectory + '/' + large, settings.pName + '/' + large, function(e){
		if (e){
			log('local :: error transferring file to service', e);
			addMediaToProject(req, next);
		}	else{
			log('local :: large file uploaded to service');
			fs.unlinkSync(settings.pDirectory + '/' + large);
			if (fs.existsSync(settings.pDirectory + '/' + thumb) == false) {
				addMediaToProject(req, next);
			}	else{
				service.upload(settings.pDirectory + '/' + thumb, settings.pName + '/' + thumb, function(e){
					if (e){
						log('local :: error transferring file to service', e);
						addMediaToProject(req, next);
					}	else{
						fs.unlinkSync(settings.pDirectory + '/' + thumb);
						log('local :: thumb file uploaded to service');
						addMediaToProject(req, next);
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

var checkDirectoryExists = function(dir)
{
	if (!fs.existsSync(dir)) { log('local :: creating directory', dir); fs.mkdirSync(dir); }
}

var log = function()
{
	var str = '';
	for(p in arguments) str += arguments[p] + ' ';
	if (settings.verboseLogs) console.log('[ pushpop –– ' + str + ' ]');
}

