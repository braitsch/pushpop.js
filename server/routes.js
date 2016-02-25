
var fs = require('fs');
var iu = require('./image-upload');
iu.settings({
	'guid' : true,
	'verbose' : true,
	'local' : __dirname + '/uploads'
});

iu.gcloud('node-upload', 'my-project');

module.exports = function(app) {

	app.locals.cdn = 'https://storage.googleapis.com/node-upload';

	app.get('/', function (req, res)
	{	
		iu.listFiles('/my-project', function(files){
			res.render('index', { files : files });
		})
	});

	app.post('/gallery/add', iu.upload, function(req, res)
	{
		if (iu.error){
			res.send(iu.error).status(400);
		}	else{
			console.log('image = ', req.image);
			console.log('video = ', req.video);
			res.send('ok').status(200);
		}
	});

	app.post('/gallery/sort', function(req, res)
	{


	});

	app.post('/gallery/delete', function(req, res)
	{
		iu.delete(req, function(result){

		});
	});

};