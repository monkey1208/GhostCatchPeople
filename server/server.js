var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(server);

var map_width = 1000;
var map_height = 500;

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
	socket.x = Math.floor((Math.random()*map_width)+500);
	socket.y = Math.floor((Math.random()*map_height)+250);
	var isGhost = true;
	if(ghost_num > people_num){
		isGhost = false;
		people_num ++;
	}else
		ghost_num ++;
	socket.isGhost = isGhost;
	var position = {x:socket.x, y:socket.y, isGhost:isGhost};
	player_position[socket.id] = position;
	socket_list[socket.id] = socket;
	socket.emit('init', {x:socket.x, y:socket.y, isGhost:isGhost, id:socket.id});
	socket.on('disconnect', function(){
		if(player_position[socket.id].isGhost)
			ghost_num --;
		else
			people_num --;
		delete socket_list[socket.id];
		delete player_position[socket.id];
	});
	socket.on('newPosition', function(data, fn){
		player_position[socket.id].x = data.x;
		player_position[socket.id].y = data.y;
	});
	socket.on('gameover', function(){
		if(player_position[socket.id].isGhost)
			ghost_num --;
		else
			people_num --;
		delete socket_list[socket.id];
      delete player_position[socket.id];

	});
	socket.on('restart', function(){	
		socket.x = Math.floor((Math.random()*1000)+500);
		socket.y = Math.floor((Math.random()*500)+250);
		if(ghost_num > people_num){
			isGhost = false;
			people_num ++;
		}else
			ghost_num ++;
		position = {x:socket.x, y:socket.y, isGhost:isGhost};
		player_position[socket.id] = position;
	});

   /* TODO */
   /* skill1, 2, 3, 4, 5 ... */
   /* socket.on('skill1/2/3/4/5', function(){do something});*/

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
			id:socket.id,
			x:player_position[socket.id].x,
			y:player_position[socket.id].y,
			isGhost:socket.isGhost
		});
	}
	for (var i in socket_list){
		var socket = socket_list[i];
		socket.emit('newPosition', pack);
	}
}, 1000/15);


