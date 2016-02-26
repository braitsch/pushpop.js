
var iu = require('./upload');
iu.settings({
	'guid' : true,
	'verbose' : true,
	'local' : 'uploads'
});

iu.gcloud('node-upload', 'my-project');

var activeProject;
var mongo = require('./mongo');

module.exports = function(app) {

	app.get('/', function (req, res)
	{	
		iu.listFiles(function(files){
			res.render('index', { files : files });
		})
	});

	app.get('/project/:id', function(req, res){
		activeProject = req.params['id'];
		iu.listFiles(function(files){
			res.render('index', { files : files });
		})
	});	

	app.get('/wipe', function(req, res){
		iu.wipe(function(){
			mongo.wipe(function(){
				res.redirect('/');
			});
		});
	});

	app.get('/print', function(req, res){
		mongo.get(function(files){
			res.send(files);
		})
	});

	app.post('/upload', iu.upload, function(req, res)
	{
		if (iu.error || !req.media){
			res.send(iu.error).status(500);
		}	else{
			mongo.add(req.media, function(){
				res.send('ok').status(200);
			});
		}
	});

};