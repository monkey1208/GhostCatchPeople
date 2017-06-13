// Game Constants Setting
var GHOST_ENERGY_RECOVER_PER_SECOND = 5
var HUMAN_ENERGY_RECOVER_PER_SECOND = 10
var HUMAN_ENERGY_INIT = 50
var MAX_ENERGY = 100
var Q_COST_ENERGY = 20
var W_COST_ENERGY = 30
var E_COST_ENERGY = 70
var R_COST_ENERGY = 50
var R_DISTANCE = 180

// Displaying Constansts
var WIDTH=500;
var HEIGHT=50;
var ENERGY_COLOR = '#EEEE00'

var server_ip = 'localhost'
var socket = io('//'+server_ip+':8000/monitor');

var map_width = 1050;
var map_height = 550;
var map_init = new Array(map_height);
for(var i = 0; i < map_height; i ++){
    map_init[i] = new Array(map_width);
}

var x = 500, y = 250;
var flash_x, flash_y;
var x_edge1 = 0, x_edge2 = 1000;
var y_edge1 = 0, y_edge2 = 500;
var x_mypos = 500, y_mypos = 250;
var id, isGhost;
var energy = 0;
var width, height;
var speed = 30;
var block_size = 50;
var game_map = null;
var me;
var lastkey = 0;

window.onload = function(){
    var box = document.getElementById("box");
    var ctx = box.getContext("2d");
    ctx.clearRect(0, 0, 1050, 550);
    width = $(window).width();
    height = $(window).height();

   socket.on('init', function(data){
      game_map = data.game_map
	   for(var i = 0; i < 11; i ++){
		   for(var j = 0; j < 21; j ++){
			   for(var k = 0; k<block_size; k ++){
				   for(var l = 0; l<block_size; l ++){
					   map_init[i*block_size+k][j*block_size+l] = game_map[i][j]
				   }
			   }
		   }
	    }
		console.log("init success!");
	});
	console.log('test');

	socket.on('newPosition', function(d){
		ctx.clearRect(0, 0, 1050, 550);
		var player_position = {};

		var data = d.pack;
		var danger_pos = d.danger_pos;
        	//console.log(danger_pos);
		var explode_pos = d.explode_pos;

		for(var i = 0; i < data.length; i++){
			var position = {x:data[i].x/2, y:data[i].y/2, isGhost:data[i].isGhost, id:data[i].id};
			player_position[data[i].id] = position;
		}

		var imgData = ctx.getImageData(0, 0, 1050, 550);
		var img = imgData.data;
        for(var i = 0; i < img.length; i += 4){
            my = Math.floor((i/4)/1050);
            mx = (i/4)%1050;
            if(map_init[my][mx]>0){
                img[i] = 0;
                img[i+1] = 0;
                img[i+2] = 0;
                img[i+3] = 255;
            }else{
                img[i] = 255;
                img[i+1] = 255;
                img[i+2] = 255;
                img[i+3] = 255;
            }

            for(var j in player_position){
                if(mx >= player_position[j].x && mx <= player_position[j].x+25 &&
                   my >= player_position[j].y && my <= player_position[j].y+25){
                    if(player_position[j].isGhost){
                        img[i] = 6;
                        img[i+1] = 76;
                        img[i+2] = 20;
                        img[i+3] = 255;
                    }else{
                        img[i] = 255;
                        img[i+1] = 33;
                        img[i+2] = 0;
                        img[i+3] = 255;
    		        }
                }
            }

        }
        ctx.putImageData(imgData, 0, 0);
        /*
        for(var i in player_position){
            if(player_position[i].x > x_edge1 && player_position[i].x < x_edge2
               && player_position[i].y > y_edge1 && player_position[i].y < y_edge2){
                if(player_position[i].isGhost){
                    ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, player_position[i].x - x_edge1, player_position[i].y - y_edge1, 50, 50);
		            }
                else{
                    ctx.drawImage(Img.human, 0, 0, Img.human.width, Img.human.height, player_position[i].x - x_edge1, player_position[i].y - y_edge1, 50, 50);
		            }
            }
        }
        */
	});
}
