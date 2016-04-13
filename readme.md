#[pushpop.js](http://pushpop.herokuapp.com)

A lightweight media manager and thumbnail generator for [Node.js](https://nodejs.org)

![pushpop-modal](./readme.img/pushpop-modal.png?raw=true)

##About

pushpop.js is a client & server package that makes it easy to generate custom image thumbnails using a marquee/crop tool similar to the one in Photoshop.

Image thumbnails are defined on the client within the modal window you see above and then sent to the server where they are processed and saved either to the local disk or one of the supported cloud storage solutions.

Metadata about each image such as when it was created and any projects it may be associated with are automatically saved to a Mongo database.

pushpop.js was designed to be the media manager of your Node.js based CMS allowing you to easily upload images and generate custom thumbnails for them that fit the design of your site. It also supports linking in videos that are hosted on youtube or vimeo.

##Installation

pushpop.js is two parts, a client side package of JavaScript, HTML and CSS files and a npm module that runs on your Node server. Let's walk through the steps to set everything up.

###Client Side

**pushpop** on the client uses a very small subset of [Twitter Bootstrap](http://getbootstrap.com/) to render the modal windows and the [jQuery Form Plugin](http://malsup.com/jquery/form/) to handle the image uploads. Everything that is required is minified into a pair of **pushpop.js & pushpop.css** files that you just include in your HTML.

The markup for the modal windows is provided as both a [pug (formerly jade) template](https://github.com/pugjs/pug) as well as regular old HTML (index.pug & index.html respectively).

###Server Side

**pushpop** on the server is just an npm module that you can install with:

``npm install --save pushpop`` 

**pushpop** provides two POST request handlers: upload & delete. 

In a typical [Express](http://expressjs.com/) application you'll handle these incoming requests as follows:

	var pushpop = require('pushpop');

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

When an image is uploaded to ``/upload`` the **pushpop** middleware intercepts the request, generates the thumbnail and saves it and the source image to any directory or cloud storage service of your choosing.

##Configuration

// todo //

##Datastores

* [MongoDB](https://www.mongodb.org/)
* [Google Cloud Storage](cloud.google.com/storage)

##Coming Soon

* support for [Redis](http://redis.io/)
* support for [Amazon S3](http://aws.amazon.com/s3/)
* support for [Azure Storage](https://azure.microsoft.com/en-us/services/storage/)  

##Contributing

// todo //