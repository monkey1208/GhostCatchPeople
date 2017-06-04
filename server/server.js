var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');

app.use('/src', express.static('client/src'));

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, '../', 'client', 'index.html'));
	console.log("running on localhost");
});

app.get('/game', function(req, res){
	res.sendFile(path.join(__dirname, '../', 'client', 'game.html'));
	console.log("join game");
});
app.listen(process.env.PORT || 8000);
