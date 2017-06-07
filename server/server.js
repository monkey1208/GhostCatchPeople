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
var player_position = {};
var ghost_num = 0;
var people_num = 0;
var game_socket = io.of('/game');
io.on('connection', function(socket){
	console.log("connect");
});

game_socket.on('connection', function(socket){
	console.log("game connected");
	socket.id = Math.random();
	socket.x = Math.floor((Math.random()*1000));
	socket.y = Math.floor((Math.random()*2000));
	var isGhost = true;
	if(ghost_num > people_num){
		isGhost = false;
	}
	var position = {x:socket.x, y:socket.y, isGhost:isGhost};
	player_position[socket.id] = position;
	socket_list[socket.id] = socket;
	socket.on('init', function(data, fn){
		fn({x:socket.x, y:socket.y, isGhost:isGhost, id:socket.id});
	});
	socket.on('disconnect', function(){
		delete socket_list[socket.id];
		delete player_position[socket.id];
	});
	socket.on('newPosition', function(data, fn){
		player_position[socket.id].x = data.x;
		player_position[socket.id].y = data.y;
	});
	
	for (var i in socket_list){
		console.log("socket "+socket_list[i].id);
		console.log("position x = "+player_position[i].x+", y = "+player_position[i].y);
	}
});

setInterval(function(){
	var pack = [];
	for (var i in socket_list){
		var socket = socket_list[i];
		pack.push({
			x:socket.x,
			y:socket.y,
			isGhost:socket.isGhost
		});
	}
	for (var i in socket_list){
		var socket = socket_list[i];
		socket.emit('newPosition', pack);
	}
}, 1000/25);


