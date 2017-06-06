var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(server);
server.listen(process.env.PORT || 8000);
//io.listen(server);

app.use('/src', express.static('client/src'));
app.use(function(req, res, next){
	res.io = io;
	next();
});
app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, '../', 'client', 'index.html'));
	console.log("running on localhost");
});

app.get('/game', function(req, res){
	res.sendFile(path.join(__dirname, '../', 'client', 'game.html'));
	console.log("join game");
});

var socket_list = {};
var game_socket = io.of('/game');
io.sockets.on('connection', function(socket){
	console.log("connect");
	socket.id = Math.random();
	socket.x = 0;
	socket.y = 0;
	socket_list[socket.id] = socket;
	socket.on('init', function(data, fn){
		
	});
	socket.on('disconnect', function(){
		delete socket_list[socket.id];
	});
	for (var i in socket_list){
		console.log("socket "+socket_list[i].id);
	}
});

setInterval(function(){
	var pack = [];
	for (var i in socket_list){
		var socket = socket_list[i];
		socket.x += 5;
		socket.y += 5;
		pack.push({
			x:socket.x,
			y:socket.y
		});
	}
	for (var i in socket_list){
		socket.emit('newPosition', pack);
	}
}, 1000/25);

game_socket.on('connection', function(socket){
	console.log("game connected");
});


