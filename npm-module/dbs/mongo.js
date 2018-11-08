
var mongo = function(log)
{
	const ObjectId = require('mongodb').ObjectID;
	const MongoClient = require('mongodb').MongoClient;

	let db = {
		name : process.env.DB_NAME || 'pushpop',
		host : process.env.DB_HOST || 'localhost',
		port : process.env.DB_PORT || 27017
	}
	if (process.env.NODE_ENV != 'live'){
		db.url = 'mongodb://' + db.host + ':' + db.port;
	}	else {
		db.url = 'mongodb://' + process.env.DB_USER+':'+process.env.DB_PASS+'@'+db.host + ':' + db.port;
	}

	let media = undefined;
	MongoClient.connect(db.url, { useNewUrlParser: true }, function(e, client) {
		if (e){
			console.log(e);
		}	else{
			media = client.db(db.name).collection('media');
			console.log('mongo :: connected to database :: "'+db.name+'"');
		};
	});

	/*
		public methods
	*/

	this.getMediaById = function(id, cback)
	{
	// get a single media object by its id //
		media.findOne({ _id:ObjectId(id) }, function(e, obj){ cback(obj); });
	}

	this.getMediaInProject = function(pName, cback)
	{
	// get all media associated with the requested project //
		media.find({ project:pName }).sort({'date':-1,'name':1}).toArray(function(e, a) { cback(a); });
	} 

	this.getAll = function(cback)
	{
		media.find({ }).sort({'date':-1,'name':1}).toArray(function(e, a) { cback(a); });
	}

	this.save = function(nMedia, cback)
	{
		nMedia.date = new Date();
		media.insertOne(nMedia, { safe:true }, cback);
	}

	this.delete = function(id, cback)
	{
		media.deleteOne({ _id:ObjectId(id) }, cback);
	}

	this.reset = function(cback)
	{
		media.deleteMany({}, cback);
	}
}

module.exports = function(logFunc) 
{
	return new mongo(logFunc);
};


