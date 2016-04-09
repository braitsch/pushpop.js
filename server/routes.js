
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

// delete from demo anything that is older than three minutes //
var CronJob = require('cron').CronJob;
new CronJob('*/1 * * * *', pushpop.purge, 3, true, 'America/Los_Angeles');

module.exports = function(app) {

	app.get('/', function (req, res)
	{	
		res.redirect('/project/gallery');
	});

	app.get('/project/:id', function(req, res)
	{
	// set the active project //
		pushpop.setProject(req.params['id'], function(project){
			res.render('gallery', { project : project });
		});
	});	

	app.get('/project/:id/print', function(req, res){
		pushpop.getProject(req.params['id'], function(project){
			res.send({ project : project });
		})
	});

	app.get('/print', function(req, res){
		pushpop.getAll(function(projects){
			res.send({ projects : projects });
		})
	});

	app.get('/reset', function(req, res){
		pushpop.reset(function(){
			res.redirect('/');
		});
	});

	app.post('/delete', pushpop.delete, function(req, res)
	{
		if (!pushpop.error){
			res.send('ok').status(200);
		}	else{
			res.send(pushpop.error).status(500);
		}
	});

	app.post('/upload', pushpop.upload, function(req, res)
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

