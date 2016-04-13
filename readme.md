#[pushpop.js](http://pushpop.herokuapp.com)

A lightweight media manager and thumbnail generator for [Node.js](https://nodejs.org)

![pushpop-modal](./readme.img/pushpop-modal.png?raw=true)

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

3. Require & configure the **pushpop** middleware on your server as explained next.

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

##Configuration

**pushpop** provides a few configuration methods that will help you to tailor it to your needs.

* Set the local directory where uploads are saved

		pushpop.uploadTo('uploads');

* Overwrite the incoming file name with a [global unique identifier](https://en.wikipedia.org/wiki/Globally_unique_identifier)

		pushpop.uniqueIds(true);

* Set the default database (currently only Mongo is supported)

		pushpop.database('mongo');

* Save files to Google Cloud Storage instead of the local filesystem

		pushpop.service('gcloud', 'pushpop');

* Enable verbose logging

		pushpop.verboseLogs(true);


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

// todo //