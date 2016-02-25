
var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require("body-parser");

app.locals.pretty = true;
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'jade');
app.set('views', './server/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

require('./server/routes')(app);
require('./server/stripe')(app);

http.listen(app.get('port'), function(q, r)
{
	console.log('*********************************************');
	console.log('Express server listening on port', app.get('port'));
});

