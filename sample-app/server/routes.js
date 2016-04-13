
//var pushpop = require('../../pushpop-npm/index');
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
// pushpop.service('gcloud', 'pushpop');

module.exports = function(app) {

	app.get('/', function (req, res)
	{	
		res.render('index')
		//res.sendfile(__dirname + '/index.html')
	});

	app.post('/upload', pushpop.upload, function(req, res)
	{
		if (!pushpop.error){
			res.send('ok').status(200);
		}	else{
			res.send(pushpop.error).status(500);
		}
	});

	app.post('/delete', pushpop.delete, function(req, res)
	{
		if (!pushpop.error){
			res.send('ok').status(200);
		}	else{
			res.send(pushpop.error).status(500);
		}
	});

	app.get('*', function(req, res){
		if (req.url != '/favicon.ico'){
			res.redirect('/');
		}	else{
			res.sendStatus(404);
		}
	});

};

