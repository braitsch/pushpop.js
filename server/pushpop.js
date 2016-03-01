
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
	if (!fs.existsSync(opts.local)) mkdir(opts.local);
}

exports.set = function(pName, cback)
{
	opts.pName = pName;
// update the local upload destination //
	opts.pdir = opts.local + '/' + opts.pName;
// and always ensure it exists before we attempt to write to it //
	if (!fs.existsSync(opts.pdir)) mkdir(opts.pdir);
// get the requested project from the database //
	db.get(pName, cback);
}

exports.get = function(pName, cback)
{
	db.get(pName, cback);
}

exports.getAll = function(cback)
{
	db.getAll(cback);
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
		log('data received');
		if (fields.type == 'video'){
			req.media.type = 'video';
			req.media.url = fields.url;
			req.media.preview = fields.preview;
			addMediaToProject(req, next);
			return;
		}	else if (fields.type == 'image'){
			if (fields.thumb == undefined){
				if (gCloud == undefined){
					addMediaToProject(req, next);
				}	else{
					saveToGoogleCloud(req, next);
				}
			}	else{
				saveThumb(JSON.parse(fields.thumb), req, function(){
					if (gCloud == undefined){
						addMediaToProject(req, next);
					}	else{
						saveToGoogleCloud(req, next);
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
		log('data received');
		delMediaFromProject(fields.pname, fields.index, next);
	});
	req.pipe(busboy);
}

exports.reset = function(cback)
{
	log('wiping datastore');
	db.reset(function(){
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
						log(filePath);
						exec('rm -rf '+filePath, function ( err, stdout, stderr ){ });
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

var addMediaToProject = function(req, next)
{
	var project = db.get(opts.pName, function(project){
		project.media.push(req.media);
		project.last_updated = new Date();
		db.save(project, next);
	});
}

var delMediaFromProject = function(pName, index, next)
{
	db.get(pName, function(project){
		project.media.splice(index, 1);
		db.save(project, next);
	// remove from gcloud / filesystem //
	});
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
			addMediaToProject(req, next);
		}	else{
			fs.unlinkSync(opts.pdir + '/' + large);
			log('large file uploaded to gcloud');
			if (fs.existsSync(opts.pdir + '/' + thumb) == false) {
				addMediaToProject(req, next);
			}	else{
				gCloud.upload(opts.pdir + '/' + thumb, opts.pName + '/' + thumb, function(e){
					if (e){
						log('error transferring file to gcloud', e);
						addMediaToProject(req, next);
					}	else{
						fs.unlinkSync(opts.pdir + '/' + thumb);
						log('thumb file uploaded to gcloud');
						addMediaToProject(req, next);
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

var mkdir = function(dir)
{
	log('creating directory', dir); fs.mkdirSync(dir);
}

var log = function()
{
	var str = '';
	for(p in arguments) str += arguments[p] + ' ';
	if (opts.verbose) console.log('[ pushpop –– ' + str + ' ]');
}

