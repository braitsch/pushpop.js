
var path = require('path');
//var pushpop = require('../../npm-module/index');
var pushpop = require('pushpop');

pushpop.config({
// [required] set the global upload directory //
	uploads:path.join(__dirname, '..', '/uploads'),
// [optional] overwrite file names with unique ids //
	uniqueIds:true,
// [optional] enable logging //
	enableLogs:true,
// [optional] save files to gcloud instead of the local filesystem //
//	service: { name:'gcloud', bucket:'pushpop'}
})

module.exports = function(app) {

	app.get('/', function (req, res)
	{	
		pushpop.getAll(function(media){
			res.render('pushpop-modal', { media : media });
		});
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

	app.get('/print', function(req, res){
		pushpop.getAll(function(media){
			res.send({ media : media });
		});
	});

	app.get('/reset', function(req, res){
		pushpop.reset(function(){
			res.redirect('/');
		});
	});

	app.get('*', function(req, res){
		if (req.url != '/favicon.ico'){
			res.redirect('/');
		}	else{
			res.sendStatus(404);
		}
	});

};

