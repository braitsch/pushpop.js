
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
var collection = db.collection('media');

db.open(function(e, d){
	if (e) {
		console.log(e);
	} else {
		if (process.env.NODE_ENV == 'live') {
			db.authenticate(process.env.DB_USER, process.env.DB_PASS, function(e, res) {
				if (e) {
					console.log('error: not authenticated', e);
				}
				else {
					console.log('authenticated and connected to database :: ' + dbName);
				}
			});
		}	else{
			console.log('connected to database :: ' + dbName);
		}
	}
});

/*
	public methods
*/

exports.get = function(pName, cback)
{
// get the requested project if it exists //
	collection.findOne({ name:pName }, function(e, project){
		if (project){
			cback(project);
		}	else{
	// otherwise return a new empty project //
			var project = getNewProjectObject(pName);
			collection.insert(project, { safe:true }, function(e, result){
				cback(project);
			});
		}
	});
}

exports.getAll = function(cback)
{
	collection.find({ }).sort({'date':-1,'name':1}).toArray(function(e, a) { cback(a); });
}

exports.save = function(project, cback)
{
	collection.save(project, { safe:true }, cback);
}

exports.delete = function(project, cback)
{
	collection.remove({ _id:new ObjectId(project) }, cback);
}

exports.reset = function(cback)
{
// reset the collection //
	collection.remove({}, cback);
}

var getNewProjectObject = function(pName)
{
	return {
		name : pName,
		media : [],
		last_updated : new Date() 
	}
}




