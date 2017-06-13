var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(server);

var map_width = 1000;
var map_height = 500;
var map_max_width = 2000;
var map_max_height = 1000;

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
var danger_position = {};
var explode_position = {};
var ghost_num = 0;
var people_num = 0;
var game_socket = io.of('/game');

// Map Generation
var maze_width = 20;
var maze_height = 10;
var moves = [];
var width = 2*maze_width+1;
var height = 2*maze_height+1;
var map = new Array(height);
for(var i = 0; i < height; i ++){
	map[i] = new Array(width);
}
for(var i = 0; i < height; i ++){
	for(var j = 0; j < width; j ++){
		map[i][j] = 1;
	}
}

var x_pos = 1;
var y_pos = 1;
map[x_pos][y_pos] = 0;
moves.push(y_pos+(x_pos*width));
while(moves.length>0){
    var possible_directions = "";
    if(x_pos+2 > 0 && x_pos+2 <= height-1 && map[x_pos+2][y_pos] == 1){
        possible_directions += "S";
	}
    if(x_pos-2 > 0 && x_pos-2 <= height-1 && map[x_pos-2][y_pos] == 1){
        possible_directions += "N";
    }
	if(y_pos-2 > 0 && y_pos-2 <= width-1 && map[x_pos][y_pos-2] == 1){
        possible_directions += "W";
	}
	if(y_pos+2 > 0 && y_pos+2 <= width-1 && map[x_pos][y_pos+2] == 1){
        possible_directions += "E";
	}
    if(possible_directions != ""){
        move = Math.floor((Math.random()*possible_directions.length))
        if(possible_directions[move] == "N"){
            map[x_pos-2][y_pos] = 0;
            map[x_pos-1][y_pos] = 0;
            x_pos -= 2;
		}else if(possible_directions[move] == "S"){
            map[x_pos+2][y_pos] = 0;
            map[x_pos+1][y_pos] = 0;
            x_pos +=2;
        }else if(possible_directions[move] == "W"){
            map[x_pos][y_pos-2] = 0;
            map[x_pos][y_pos-1] = 0;
            y_pos -=2;
        }else if(possible_directions[move] == "E"){
            map[x_pos][y_pos+2] = 0;
            map[x_pos][y_pos+1] = 0;
            y_pos +=2;
        }
		moves.push(y_pos+(x_pos*width));
    }else{
        var back = moves.pop();
        x_pos = Math.floor(back/width);
        y_pos = back%width;
	}
}
console.log(map.length);

io.on('connection', function(socket){
	console.log("connect");
});

game_socket.on('connection', function(socket){
	console.log("game connected");
	socket.id = Math.random();
	var randx = Math.floor((Math.random()*width)), randy = Math.floor((Math.random()*height));
	while(map[randy][randx]==1){
		randx = Math.floor((Math.random()*width));
		randy = Math.floor((Math.random()*height));
	}
	socket.x = randx*50;
	socket.y = randy*50;
	socket.skill = 0;
	var isGhost = true;
	if(ghost_num > people_num){
		isGhost = false;
		people_num ++;
	}else
		ghost_num ++;
	socket.isGhost = isGhost;
	var position = {x:socket.x, y:socket.y, isGhost:isGhost, skill:socket.skill};
	player_position[socket.id] = position;
	socket_list[socket.id] = socket;
	socket.emit('init', {x:socket.x, y:socket.y, isGhost:isGhost, id:socket.id, game_map:map});
	socket.on('disconnect', function(){
		if(player_position[socket.id].isGhost)
			ghost_num --;
		else
			people_num --;
		delete socket_list[socket.id];
		delete player_position[socket.id];
	});
	socket.on('newPosition', function(data, fn){
		//console.log("x = "+data.x+" y = "+data.y);
		if(data.x < 0)
			player_position[socket.id].x = 0;
		else if(data.x > map_max_width)
			player_position[socket.id].x = map_max_width;
		else
			player_position[socket.id].x = data.x;
		if(data.y < 0)
			player_position[socket.id].y = 0;
		else if(data.y > map_max_height)
			player_position[socket.id].y = map_max_height;
		else
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
	socket.on('skill', function(data){
		var skill = data.skill;
		switch(skill){
			case 1:
				//
				var danger_id = Math.random();
				danger_position[danger_id] = { x:player_position[socket.id].x , y:player_position[socket.id].y };
				setTimeout(function(){
					explode_position[danger_id] = {x:danger_position[danger_id].x, y:danger_position[danger_id].y, id:socket.id};
					delete danger_position[danger_id];
					setTimeout(function(){
						delete explode_position[danger_id];
						}, 1000, 'explode');
					},
					1000, 'danger -> explode');
				break;
			case 2:
				player_position[socket.id].skill = 2;
				setTimeout(function(){
					player_position[socket.id].skill = 0;},
					3000, '3sec boost!');
				break;
			case 3:
				var randx = Math.floor((Math.random()*width)), randy = Math.floor((Math.random()*height));
				while(map[randy][randx]==1){
					randx = Math.floor((Math.random()*width));
					randy = Math.floor((Math.random()*height));
				}
				player_position[socket.id].x = randx*50; 
				player_position[socket.id].y = randy*50;
				break;
		}
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
			isGhost:socket.isGhost,
			skill:player_position[socket.id].skill,
		});
	}
	for (var i in socket_list){
		var socket = socket_list[i];
		socket.emit('newPosition', {pack:pack, danger_pos:danger_position, explode_pos:explode_position});
	}
}, 1000/15);
