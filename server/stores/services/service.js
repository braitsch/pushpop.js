
/*
	cloud service interface
*/

var service = function(bucketName, logFunc) 
{
	this.getURL = function()
	{
		return '';
	}
	this.upload = function(file, destination, cback)
	{

	}
	this.delete = function(path, cback)
	{

	}
	this.listFiles = function(path, cback)
	{

	}
};

module.exports = function(bucketName, logFunc) 
{
	return new service(bucketName, logFunc);
};