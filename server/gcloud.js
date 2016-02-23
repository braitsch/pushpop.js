

var gc;
var gcloud = function(settings)
{
	console.log('connecting to gcloud :: ', settings)
	var gcloud = require('gcloud')({
		projectId: settings.projectId,
		keyFilename: settings.pathToKeyFile
	});
	var bucket = gcloud.storage().bucket(settings.bucket);
/*
	bucket must first be made public for access over http
	http://goo.gl/z5Rm2R
*/
	if (settings.public) {
		bucket.makePublic(function(e, response){
			if (response[0][0].entity == 'allUsers' && response[0][0].role == 'READER'){
				console.log('gcloud :: bucket', settings.bucket, 'is publicly visible');
			}
		});
	};

	this.listFiles = function(path)
	{
		bucket.getFiles({ prefix:path }, function(e, files) {
			if (e) {
				console.log(e);
			}	else{
				for (var i=0; i<files.length; i++){
				// ignore empty directories //
					if (files[i].metadata.size != 0){
						console.log(files[i].name, (files[i].metadata.size/1024/1024).toFixed(2) + 'MB');
					}
				};
			}
		});
	}
	this.uploadImage = function(file, destination, cback)
	{
		bucket.upload(file, { destination: bucket.file(destination) }, cback);
	}
	this.deleteImage = function(file, cback)
	{
		bucket.deleteFiles({ prefix: file }, cback);
	}
	this.deleteProject = function(project_id, cback)
	{
		bucket.deleteFiles({ prefix: project_id }, cback);
	}
}

module.exports = function(o) 
{
	if (!gc) gc = new gcloud(o);
	return gc;
};



