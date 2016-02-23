

var iu = require('./image-upload');
iu.settings({
	'guid' : true,
	'verbose' : true,
	'local' : __dirname + '/uploads',
	'remote' : 'my-project',
	'gcloud' : require('./gcloud')({
		'projectId' : process.env.GCLOUD_PID,
		'pathToKeyFile' : process.env.GCLOUD_KEY,
		'bucket' : 'node-upload',
		'public' : true,
	})
});

module.exports = function(app) {

	app.get('/', function (req, res)
	{	
		res.render('index');
	});

	app.post('/gallery/add', function(req, res)
	{
		//iu.remote('');
		iu.upload(req, function(result){
			console.log('result', result);
			if (result.error == undefined){
				res.send('ok').status(200);
			}	else{
				res.send(result.error).status(400);
			}
		});
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