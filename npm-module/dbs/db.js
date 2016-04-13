
/*
	database service interface
*/

var db = function(bucketName, logFunc) 
{
	this.get = function()
	{
		
	}
	this.getAll = function()
	{

	}
	this.save = function()
	{

	}
	this.delete = function()
	{

	}
	this.reset = function()
	{

	}
};

module.exports = function(bucketName, logFunc) 
{
	return new db(bucketName, logFunc);
};