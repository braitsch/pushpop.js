#pushpop.js

A lightweight image uploader and thumbnail generator for [Node.js](https://nodejs.org)

![pushpop-modal](./readme.img/pushpop-modal.png?raw=true)

##About

pushpop.js is a client & server package that makes it easy to generate image thumbnails using a customizable marque tool similar to what you would find in Photoshop.

Image thumbnails are defined on the client via a web frontend and then sent to the server where they are processed and saved either to the local disk or one of the supported cloud storage solutions.

Metadata about each image such as when it was created and any projects it may be associated with are automatically saved to a Mongo database.

pushpop.js was designed to be the media manager of your CMS allowing you to easly upload, delete and generate custom thumbnails for your images that fit the design of your site. It also supports linking in videos that are hosted on youtube or vimeo.


##Installation

##Datastores

* [MongoDB](https://www.mongodb.org/)
* [Google Cloud Storage](cloud.google.com/storage)

##Coming Soon

* support for [Redis](http://redis.io/)
* support for [Amazon S3](http://aws.amazon.com/s3/)
* support for [Azure Storage](https://azure.microsoft.com/en-us/services/storage/)  

##Contributing
