#[pushpop.js](http://pushpop.herokuapp.com)

A lightweight media manager and thumbnail generator for [Node.js](https://nodejs.org)

![pushpop-modal](./readme.img/pushpop-modal.png?raw=true)

**pushpop.js** is a client & server package that makes it easy to generate custom image thumbnails using a marquee/crop tool similar to the one in Photoshop.

Image thumbnails are defined on the client within the modal window you see above and then sent to the server where they are processed and saved either to the local disk or one of the supported cloud storage solutions.

Metadata about each image such as when it was created and any projects it may be associated with are automatically saved to a Mongo database.

**pushpop.js** was designed to be the media manager of your Node.js based CMS allowing you to easily upload images and generate custom thumbnails for them that fit the design of your site. It also supports linking in videos that are hosted on youtube or vimeo.

##Installation

**pushpop.js** is two parts, a client side package of JavaScript, CSS and HTML files and a [npm module](https://www.npmjs.com/package/pushpop) that runs on your Node server. 

The **sample app** included in this repository is a simple [Express](http://expressjs.com/) app that we'll use to show where everything lives and how the the client & server talk to one another. It's also a great starting point upon which to build your project.


###Client Side

**pushpop** on the client uses a very small subset of [Twitter Bootstrap](http://getbootstrap.com/) to render the modal windows and the [jQuery Form Plugin](http://malsup.com/jquery/form/) to handle the image uploads. 

These files are contained within ``/sample-app/public`` directory.

**/sample-app/public/css**

* bootstrap.min.css
* pushpop.css

**/sample-app/public/javascripts**

* bootstrap.min.js
* jquery-2.1.4.min.js
* jquery.form.min.js
* pushpop.js

Included in the root of the **sample-app** is a [gulp file](http://gulpjs.com/) that you can use to concat and minify all of these files into ``pushpop-min.js`` & ``pushpop-min.css`` files via:

``gulp pushpop``

The markup for the modal windows is provided as a [pug (formerly jade) template](https://github.com/pugjs/pug) as well as regular old HTML (``index.pug`` & ``index.html`` respectively). 

These files are sent to the client from the server which we'll talk about next.

###Server Side

**pushpop** on the server is just an npm module that you can add to your project with:

``npm install --save pushpop``

This will install **pushpop** into your project's ``node_modules`` directory.

Within ``/sample-app/server`` directory you'll see three files:

* routes.js
* index.pug
* index.html

``index.pug`` & ``index.html`` just contain the markup for the modal windows which will be sent to the client whenever it is requested.

``routes.js`` is where we'll tell our ``POST`` request handlers to use the **pushpop** middleware to process and save our incoming image uploads so let's take a look at that first.

As you can see in `routes.js` the **pushpop** middleware provides two POST request handlers: ``pushpop.upload`` & ``pushpop.delete``.

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

When an image is sent to ``/upload`` the **pushpop** middleware intercepts the request, generates the thumbnail from data contained in the ``POST`` request and then saves both the thumbnail and source image to the local ``/uploads`` directory.

##Sample App

// todo //

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