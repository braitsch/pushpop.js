
var pushpop = require('./pushpop');
pushpop.settings({
// overwrite file names with unique ids //
	'guid' : true,
// enable verbose logging //
	'verbose' : true,
// local upload directory is relative to project root //
	'local' : 'uploads'
});

// save files to gcloud instead of the local filesystem //
//pushpop.use('gcloud', 'pushpop');

module.exports = function(app) {

	app.get('/', function (req, res)
	{	
		res.redirect('/project/one');
	});

	app.get('/project/:id', function(req, res)
	{
		pushpop.set(req.params['id'], function(project){
			res.render('gallery', { project : project });
		});
	});	

	app.get('/project/:id/print', function(req, res){
		pushpop.get(req.params['id'], function(project){
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

	app.get('*', function(req, res){
		res.redirect('/');
	});

	app.post('/upload', pushpop.upload, function(req, res)
	{
		if (pushpop.error || !req.media){
			res.send(pushpop.error).status(500);
		}	else{
			res.send('ok').status(200);
		}
	});

};

