#pushpop

A lightweight image cropping tool and thumbnail generator for [Node.js](https://nodejs.org)

##Configuration

	var pushpop = require('pushpop');
	
	pushpop.config({
	
	// [required] set the global upload directory //
		uploads:path.join(__dirname, '..', '/uploads'),
	
	// [optional] overwrite file names with unique ids //
		uniqueIds:true,
	
	// [optional] enable logging //
		enableLogs:true,
	
	// [optional] save files to gcloud instead of the local filesystem //
		service: { name:'gcloud', bucket:'pushpop'}
	})
	
##Handling Uploads

**pushpop** is middleware that intercepts incoming ``POST`` requests that contain image data and generates a thumbnail from the metadata contained in the request. It then saves both the source image and thumbnail to a local or remote location of your choosing.

To use it simply add it to your ``POST`` request handler like so:

	app.post('/upload', pushpop.upload, function(req, res)
	{
		if (!pushpop.error){
			res.send('ok').status(200);
		}	else{
			res.send(pushpop.error).status(500);
		}
	});
	
[Source & Documentation](https://github.com/braitsch/pushpop.js)