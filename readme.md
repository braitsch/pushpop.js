#[pushpop.js](http://pushpop.herokuapp.com)

A lightweight media manager and thumbnail generator for [Node.js](https://nodejs.org)

[![pushpop-modal](./readme.img/pushpop-modal.png?raw=true)](http://pushpop.herokuapp.com)

**pushpop.js** is a client & server package that makes it easy to generate custom image thumbnails using a marquee/crop tool similar to the one in Photoshop.

Image thumbnails are defined on the client within the modal window you see above and then sent to the server where they are processed and saved either to the local disk or one of the supported cloud storage solutions.

Metadata about each image such as when it was created and any projects it may be associated with are automatically saved to a [Mongo](https://www.mongodb.org/) database.

**pushpop.js** was designed to be the media manager of your [Node.js](https://nodejs.org) based CMS allowing you to easily upload images and generate custom thumbnails for them that fit the design of your site. It also supports linking in videos that are hosted on YouTube or Vimeo.

##Installation

The repository includes a **sample-app** that you can use as a starting point for your project.

To run the **sample-app** first make sure [MongoDB](https://www.mongodb.org/) is installed & running on your system then:

	git clone git@github.com:braitsch/pushpop.js.git
	cd sample-app
	npm install
	node app
	
Fire up a browser window and point it at [localhost:3000](http://localhost:3000/)

---

To add **pushpop.js** to an existing project:

1. Install the [npm module](https://www.npmjs.com/package/pushpop)

		npm install --save pushpop

2. Copy the client side JavaScript & CSS files in ``/sample-app/public`` to an appropriate location in your project.

	**/sample-app/public/css**
	
	* pushpop.min.css
	* bootstrap.min.css
	
	**/sample-app/public/javascripts**

	* pushpop.min.js	
	* jquery-2.1.4.min.js
	* jquery.form.min.js
	* bootstrap.min.js

	**pushpop** uses a very small subset of [Twitter Bootstrap](http://getbootstrap.com/) to render the modal windows and the [jQuery Form Plugin](http://malsup.com/jquery/form/) to handle the image uploads. 

3. Add the Modal window markup to your HTML files. The markup is also provided as a [pug / jade template](https://github.com/pugjs/pug) for convenience. In the **sample-app** the markup files are located in the server directory.
	
	* /sample-app/server/pushpop-modal.html
	* /sample-app/server/pushpop-modal.pug


##Configuration

###Client

To add the client library to your project simply add the following line of JavaScript to your HTML after you've included the pushpop.js file:

	<script src="pushpop.js"></script>
	<script>
		var pushpop = new pushpop();
	</script>

By default uploads will be sent to ``http://yoursite.com/upload`` & requests to delete content will be sent to ``http://yoursite.com/delete``. You can change this by overriding the default API endpoints:

	var pushpop = new pushpop({
		api:{
			upload:'/some-url/api/upload',
			delete:'/some-url/api/delete',
		}
	});
	
Additionally you can limit the size of uploads (as is done in the [live demo](http://pushpop.herokuapp.com)) by passing in a limit size in megabytes.
	
	var pushpop = new pushpop({
		maxFileSize = 5; // limit image uploads to 5 megabytes
	});

By default no file limit size is imposed by the library.

###Server

Configuration on the server is simply a matter of requiring the module and telling it where you want to save your uploaded files. You do this by passing an object that to the ``config`` method.

	var pushpop = require('pushpop');
	
	pushpop.config({
	// [required] set the global upload directory //
		uploads:path.join(__dirname, '..', '/uploads'),
		
	// [optional] overwrite the incoming file name with a [global unique identifier](https://en.wikipedia.org/wiki/Globally_unique_identifier)
		uniqueIds:true,
		
	// [optional] enable logging //
		enableLogs:true,
		
	// [optional] save files to gcloud instead of the local filesystem //
		service: { name:'gcloud', bucket:'pushpop'}
	});

##Basic Usage

The **pushpop.js** client library provides two Modal windows that allow you to upload (push) images & thumbnails to your server as well as delete (pop) them off later if desired.

* pushpop-modal-push
* pushpop-modal-pop

Typically you'll want to display the modal **push** window as the result of some user generated event like a button click:

	var pushpop = new pushpop();
	$('#add-new-image-button').click(function(){
		pushpop.showModalPush();
	});

When an image is uploaded metadata is captured that describes details about the image:

	metadata = {
		type: 'image', // this can also be 'video' //
		name: '47f62ee9-5164-4681-8d06-2a515a237997',
		format: '.png',
		host: 'localhost',
		project: 'my-portfolio',
		date: '2016-04-13T23:55:42.104Z',
	}

This metadata is saved in a database collection and is sent back to the client whenever the containing project, in this case ``my-portfolio`` is requested.

###Projects

**pushpop** groups your media assets together into containers called ``projects``

The default project is called ``gallery`` although you can easily change this to anything you want by calling:

	pushpop.setProject('client-review');

All assets saved after a call to ``setProject`` will have the new project name saved in their metadata.

A trival way to change the project could be by hitting a URL with the project name, for example:

	app.get('/project/:id', function(req, res)
	{
		pushpop.setProject(req.params['id'], function(project){
			res.render('gallery', { project : project });
		});
	});	


To build a page of assets from a given project simply call ``getProject`` passing in the name of the project you wish to display.

	app.get('/', function(req, res)
	{
		pushpop.getProject('gallery', function(project){
			res.render('gallery', { project : project });
		});
	});	

This will return an array of metadata objects that all have the project's name as their ``project`` field.

You use this metadata to generate your HTML, for example:

	// psuedocode //
	for(var i=0; i<project.length; i++){
		var image = project[i];
		<img src=image.host+'/'+image.name+'.'+image.format />
	}


You'll also need to save this metadata and pass it along to the modal **pop** window in the event that you ever wish to delete it.

	// psuedocode //
	for(var i=0; i<project.length; i++){
		var image = project[i];
		var url = image.host+'/'+image.name+'.'+image.format;
		<img src=url data-meta=image />
	}

Then when we click on an image we can bring up the `pop` modal window and give the user the option to delete it.

	// psuedocode //
	$(img).click(function(){
		pushpop.showModalPop(this.data('meta'));
	})

##Middleware

**pushpop** on the server is middleware that intercepts incoming ``POST`` requests that contain image data and generates a thumbnail from metadata contained in the request. It then saves both the source image and thumbnail to a local or remote location of your choosing.

To handle an incoming upload simply add the middleware to your ``POST`` request handler like so:

**/sample-app/server/routes.js**

	var pushpop = require('pushpop');

	app.post('/upload', pushpop.upload, function(req, res)
	{
		if (!pushpop.error){
			res.send('ok').status(200);
		}	else{
			res.send(pushpop.error).status(500);
		}
	});


##MongoDB

**pushpop** uses environment variables to connect to your database instance:

	process.env.DB_NAME || 'pushpop';
	process.env.DB_HOST || 'localhost';
	process.env.DB_PORT || 27017;

If you need to authenticate be sure to also set:

	process.env.DB_USER || 'braitsch' 
	process.env.DB_PASS	|| '1234'

##Google Cloud Storage

You can save your images to your GCS account by telling **pushpop** to use the ``gloud`` service passing in the name of your bucket as the second parameter.

	pushpop.service('gcloud', 'pushpop');

**pushpop** also uses environment variables to connect to your GCS account:

	process.env.GCLOUD_PROJECT = 'grape-spaceship-123'
	process.env.GCLOUD_KEY_FILE = '/path/to/keyfile.json'

If you're running on [Heroku](https://www.heroku.com/) you'll need to convert the contents of your keyfile into a string and then set that string as a separate ``GCLOUD_JSON`` environment variable.

	process.env.GCLOUD_JSON = '{
		"private_key_id": "...",
		"private_key": "...",
		"client_email": "...",
		"client_id": "...",
		"type": "service_account"
	}'	

##Coming Soon

* support for [Redis](http://redis.io/)
* support for [Amazon S3](http://aws.amazon.com/s3/)
* support for [Azure Storage](https://azure.microsoft.com/en-us/services/storage/)  

##Contributing

Questions, feedback, feature requests and ideas for improvement are all very much welcome. Please open an [issue](https://github.com/braitsch/pushpop.js/issues) to help facilitate a community discussion instead of sending me an email.