#pushpop

A lightweight media manager and thumbnail generator for [Node](https://nodejs.org)



	var pushpop = require('pushpop');
	// overwrite file names with unique ids //
	pushpop.uniqueIds(true);
	// enable verbose logging //
	pushpop.verboseLogs(true);
	// local upload directory is relative to project root //
	pushpop.uploadTo('uploads');
	// use mongodb as the database //
	pushpop.database('mongo');
	// save files to gcloud instead of the local filesystem //
	pushpop.service('gcloud', 'pushpop');
	
More documentation coming soon