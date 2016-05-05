
/*
	database service interface
*/

var db = function(bucketName, logFunc) 
{
	this.getMediaById = function(id, cback)
	{
		
	}
	this.getMediaInProject = function(pName, cback)
	{

	}
	this.getAll = function(cback)
	{

	}
	this.save = function(nMedia, cback)
	{

	}
	this.delete = function(id, cback)
	{

	}
	this.reset = function(cback)
	{

	}
};

module.exports = function(bucketName, logFunc) 
{
	return new db(bucketName, logFunc);
};