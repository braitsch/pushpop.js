
var gcloud = function(bucketName, log)
{
	var gcloud;
	var gcloudURL = 'https://storage.googleapis.com/'+bucketName;
	log('gcloud :: connecting to bucket "'+bucketName+'"');
	if (process.env.GCLOUD_KEY_FILE){
		gcloud = require('gcloud')({
			projectId: process.env.GCLOUD_PROJECT,
			keyFilename: process.env.GCLOUD_KEY_FILE,
		});
	}	else{
		gcloud = require('gcloud')({
			projectId: process.env.GCLOUD_PROJECT,
			credentials: JSON.parse(process.env.GCLOUD_JSON) 
		});
	}
	var bucket = gcloud.storage().bucket(bucketName);
/*
	bucket must first be made public for access over http
	http://goo.gl/z5Rm2R
*/
	bucket.makePublic(function(e, response){
		if (e){
			log('gcloud :: unable to make bucket "'+bucketName+'" publicly visible');
			log('gcloud ::', e);
		}	else{
			if (response[0][0].entity == 'allUsers' && response[0][0].role == 'READER'){
				log('gcloud :: bucket "'+bucketName+'" is publicly visible');
			}
		}
	});
	this.getURL = function()
	{
		return gcloudURL;
	}
	this.upload = function(file, destination, cback)
	{
		log('gcloud :: uploading', file)
		bucket.upload(file, { destination: bucket.file(destination) }, cback);
	}
	this.delete = function(path, cback)
	{
		log('gcloud :: deleting files:', path)
		bucket.deleteFiles({ prefix: path }, cback);
	}
	this.listFiles = function(path, cback)
	{
		bucket.getFiles({ prefix:path }, function(e, files) {
			if (e) {
				log(e);
			}	else{
				var a = [];
				for (var i=0; i<files.length; i++){
				// ignore empty directories & thumbnails //
					if (files[i].metadata.size != 0 && files[i].name.search('_thumb') != -1){
						a.push({
							'name' : files[i].name,
							'date' : files[i].metadata.updated,
							'size' : (files[i].metadata.size/1024/1024).toFixed(2) + 'MB',
							'path' : gcloudURL +'/'+ bucketName +'/'+ files[i].name,
						});
					}
				};
			// return list of files sorted by date descending //
				a.sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
				cback(a);
			}
		});
	}
}

module.exports = function(bucketName, logFunc) 
{
	return new gcloud(bucketName, logFunc);
};



