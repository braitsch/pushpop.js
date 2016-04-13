
var express = require('express');
var app = express();
var http = require('http').Server(app);
// bodyParser only required for stripe integration //
var bodyParser = require('body-parser'); 

app.locals.pretty = true;
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'jade');
app.set('views', './server/views');
// bodyParser only required for stripe integration //
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));

require('./server/routes')(app);
require('./server/stripe')(app);

http.listen(app.get('port'), function(q, r)
{
	console.log('Express server listening on port', app.get('port'));
});

