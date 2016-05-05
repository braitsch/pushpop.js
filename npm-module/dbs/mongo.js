
var mongo = function(log)
{

	var MongoDB		= require('mongodb').Db;
	var Server		= require('mongodb').Server;
	var ObjectId 	= require('mongodb').ObjectID;

	/*
		ESTABLISH DATABASE
	*/

	var dbName = process.env.DB_NAME || 'pushpop';
	var dbHost = process.env.DB_HOST || 'localhost'
	var dbPort = process.env.DB_PORT || 27017;

	var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
	var media = db.collection('media');

	db.open(function(e, d){
		if (e) {
			log(e);
		} else {
			if (process.env.NODE_ENV == 'live') {
				db.authenticate(process.env.DB_USER, process.env.DB_PASS, function(e, res) {
					if (e) {
						log('mongo :: error: not authenticated', e);
					}
					else {
						log('mongo :: authenticated and connected to database :: "'+dbName+'"');
					}
				});
			}	else{
				log('mongo :: connected to database :: "'+dbName+'"');
			}
		}
	});

	/*
		public methods
	*/

	this.getMediaById = function(id, cback)
	{
	// get a single media object by its id //
		media.findOne({ _id:new ObjectId(id) }, function(e, obj){ cback(obj); });
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
		media.save(nMedia, { safe:true }, cback);
	}

	this.delete = function(id, cback)
	{
		media.remove({ _id:new ObjectId(id) }, cback);
	}

	this.reset = function(cback)
	{
		media.remove({}, cback);
	}
}

module.exports = function(logFunc) 
{
	return new mongo(logFunc);
};



