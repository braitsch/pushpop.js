
var opts;
var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });
var guid = function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}

exports.settings = function(obj)
{
	opts = obj;	
	opts.remote = getRemotePath(obj.remote);
}

exports.remote = function(dest)
{
	opts.remote = getRemotePath(dest);
}

exports.upload = function(req, cback)
{
	var result = { };
	if (req.body.type == 'video'){
		result.video = { 'url' : req.body.url, 'preview' : req.body.preview };
		cback(result);
	}	else{
		getImageData(req, function(image){
			result.image = image;
			saveLarge(image, function(e){
				if (e) {
					exit(result, e, cback);
				}	else{
					saveThumb(image, function(e){
						if (e) {
							exit(result, e, cback);
						}	else if (opts.gcloud){
							saveToGoogleCloud(image, function(e){
								exit(result, e, cback);
							});
						}	else{
							exit(result, e, cback);
						}
					});	
				}
			});
		});
	}
}

exports.delete = function(filename, cback)
{
//	var result = { };
}

exports.listFiles = function(directory, cback)
{
	opts.gcloud.listFiles(getRemotePath(directory), cback);
}

var getImageData = function(req, cback)
{
	var image = {};
	req.pipe(req.busboy);
	req.busboy.on('file', function(fieldname, fileObj, filename){
		image.file = fileObj;
		image.path = opts.local;
		image.type = getFileType(filename);
		image.name = getFileName(filename);
	});
	req.busboy.on('field', function(key, value, keyTruncated, valueTruncated) {
		if (key == 'thumb' && value != '') {
			image.thumbdata = JSON.parse(value);
			console.log(image.thumbdata);
		}	else if (key == 'caption' && value != '') {
			image.caption = value;
		}
	});
	setTimeout(cback, 100, image);
}

var saveLarge = function(image, cback)
{
	if (!fs.existsSync(image.path)) fs.mkdirSync(image.path);
	var fstream = fs.createWriteStream(image.path + '/' + image.name + image.type);
	image.file.pipe(fstream);
	fstream.on('close', function(e){
		log('large image saved');
		cback();
	});
}

var saveThumb = function(image, cback)
{
	var thumb = image.thumbdata;
	if (thumb == undefined){
		log('no data to create thumbnail');
		cback();
	}	else{
		var img = gm(image.path + '/' + image.name + image.type);
		img.crop(thumb.crop.w, thumb.crop.h, thumb.crop.x, thumb.crop.y);
	// do not resize if we did not explicitly receive a width & height value //
		if (thumb.width != 0 && thumb.height != 0) img.resize(thumb.width, thumb.height, '!');
		img.noProfile();
		img.write(image.path + '/' + image.name + '_thumb'+ image.type, function(){
			log('thumb image saved');
			cback();
		});
	}
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

var exit = function(result, e, cback)
{
	result.error = e; 
	delete result.image.file;
	delete result.image.thumbdata;
	cback(result);
}

var log = function()
{
	var str = '';
	for(p in arguments) str += arguments[p] + ' ';
	if (opts.verbose) console.log('[ image uploader –– ' + str + ' ]');
}

var saveToGoogleCloud = function(image, cback)
{
	log('uploading to google cloud');
	var large = image.name + image.type;
	var thumb = image.name + '_thumb'+ image.type;
	opts.gcloud.uploadImage(image.path+'/'+large, opts.remote + large, function(e){
		if (e){
			log('error transferring file to gcloud');
			cback(e);
		}	else{
			fs.unlinkSync(image.path+'/'+large);
			log('large file uploaded to gcloud');
			if (image.thumbdata == null){
				cback();
			}	else{
				opts.gcloud.uploadImage(image.path+'/'+thumb, opts.remote + thumb, function(e){
					if (e){
						log('error transferring file to gcloud');
						cback(e);
					}	else{
						fs.unlinkSync(image.path+'/'+thumb);
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

