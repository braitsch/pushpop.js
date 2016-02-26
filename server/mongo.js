
var MongoDB		= require('mongodb').Db;
var Server		= require('mongodb').Server;
var BSON		= require('mongodb').BSONPure;

/*
	ESTABLISH DATABASE
*/

var dbName = process.env.DB_NAME || 'modal-upload';
var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;

//mongodb://dbuser:dbpass@host:port/dbname
//mongodb://heroku_23fhp12j:5q3uek3jnn2j4omg8kqreg6ut4@ds017258.mlab.com:17258/heroku_23fhp12j

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
var items = db.collection('items');

db.open(function(e, d){
	if (e) {
		console.log(e);
	} else {
		console.log('connected to database ::', dbName);
	}
});


/*
	public methods
*/

exports.get = function(cback)
{
	items.find( { } ).sort({'date':-1,'name':1}).toArray(function(e, a) {
		cback(a);
	});
}

exports.add = function(media, cback)
{
	media.date = new Date();
	console.log('-------saving-------');
	console.log(media);
	console.log('--------------------');
	items.insert(media, { safe:true }, cback);
}

exports.wipe = function(cback)
{
	console.log('wiping mongodb');
	items.remove({}, cback);
}

