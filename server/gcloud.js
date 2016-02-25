
var gc;
var gcloud = function(settings)
{
	console.log('connecting to gcloud :: ', settings)
	// console.log(process.env.GCLOUD_KEY);
	// console.log(process.env.GCLOUD_EMAIL);
	var gcloud = require('gcloud')({
		projectId: process.env.GCLOUD_PROJECT,
			credentials: JSON.parse(process.env.GCLOUD_JSON) 
		// credentials: {
		// 	private_key : process.env.GCLOUD_KEY,
		// 	client_email : process.env.GCLOUD_EMAIL
		// }
		//keyFilename: process.env.GCLOUD_KEY_FILE
	});
	var bucket = gcloud.storage().bucket(settings.bucket);
/*
	bucket must first be made public for access over http
	http://goo.gl/z5Rm2R
*/
	if (settings.public) {
		bucket.makePublic(function(e, response){
			if (e){
				console.log('unable to connnect to gcloud', e);
			}	else{
				if (response[0][0].entity == 'allUsers' && response[0][0].role == 'READER'){
					console.log('gcloud :: bucket', settings.bucket, 'is publicly visible');
				}
			}
		});
	};

	this.listFiles = function(path, cback)
	{
		bucket.getFiles({ prefix:path }, function(e, files) {
			if (e) {
				console.log(e);
			}	else{
				var a = [];
				for (var i=0; i<files.length; i++){
				// ignore empty directories & thumbnails //
					if (files[i].metadata.size != 0 && files[i].name.search('_thumb') != -1){
						a.push({
							'name' : files[i].name,
							'date' : files[i].metadata.updated,
							'size' : (files[i].metadata.size/1024/1024).toFixed(2) + 'MB'
						});
					}
				};
			// return list of files sorted by date descending //
				a.sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
				cback(a);
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



