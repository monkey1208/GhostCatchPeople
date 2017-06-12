var socket = io('//localhost:8000/game');
var map_init = new Array(1000);
for(var i = 0; i < 1000; i ++){
	map_init[i] = new Array(2000);
}
for(var i = 0; i < 1000; i ++){
	for(var j = 0; j < 2000; j ++){
		map_init[i][j] = Math.random();
	}
}
var x = 500, y = 250;
var x_edge1 = 0, x_edge2 = 1000;
var y_edge1 = 0, y_edge2 = 500;
var id, isGhost;
var score = 0;

window.onload = function(){
	var Img = {};
	Img.ghost = new Image();
	Img.ghost.src = "src/img/ghost.jpg";
	Img.human = new Image();
	Img.human.src = "src/img/human.jpg";
	socket.on('init', function(data){
		x = data.x;
		y = data.y;
		id = data.id;
		isGhost = data.isGhost;
      if(isGhost)
			me.src = Img.ghost.src;
		else{
			me.src = Img.human.src;
         setInterval(function(){
            score += 1;
            $("#scoreboard").text(score);
         }, 1000);
      }
		console.log("init success!");
	});
	var meee = document.getElementById("me");
	var box = document.getElementById("box");
	var ctx = box.getContext("2d");
	console.log('test');

	
	/*socket.on('newPosition', function(data){
		ctx.clearRect(0, 0, 1000, 500);
		console.log('newposition');
		for(var i = 0; i < data.length; i++){
			ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, data[i].x, data[i].y, 50, 50);
		}
	});*/
	//ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, 0, 0, 1000, 500);
	//ctx.drawImage(Img.human, 0, 0, Img.human.width, Img.human.height, 0, 0, 1000, 500);
	/*var imgData = ctx.getImageData(0, 0, 1000, 500);
	var data = imgData.data;

	for(var i = 0; i < data.length; i += 4){
		// console.log(map_init[y+Math.floor((i/4)/1000)][x+(i/4)%1000]);
		if(map_init[y+Math.floor((i/4)/1000)][x+(i/4)%1000]>=0.7){ // map_init[??] >= 0.7
			data[i+3] = 255;

		}
		else{
			data[i+3] = 0;
		}
	}
	ctx.putImageData(imgData, 0, 0);*/
	
	window.onkeydown = function(e){
		//ctx.clearRect(0, 0, 1000, 500);
		var speed = 20;
		switch(e.keyCode){
			case 37:
				if(x >= 5){ //505
					x -= speed;
				}
				break;
			case 38:
				if(y >= 5){ //255
					y -= speed;
				}
				break;
			case 39:
				if(x <= 1995){ //1495
					x += speed;
				}
				break;
			case 40:
				if(y <= 995){ //745
					y += speed;
				}
				break;
		}	
		//alert(x + ", " +  y);
		socket.emit('newPosition', {x: x, y: y}, function(data){
		});
		
	}
	socket.on('newPosition', function(data){
		var imgData = ctx.getImageData(0, 0, 1000, 500);
		var img = imgData.data;
		ctx.clearRect(0, 0, 1000, 500);
		var me = document.getElementById("me");
		var player_position = {};
		
		for(var i = 0; i < data.length; i++){
			if(id == data[i].id){
				x = data[i].x;
				y = data[i].y;
			}else{
				var position = {x:data[i].x, y:data[i].y, isGhost:data[i].isGhost, id:data[i].id};
				player_position[data[i].id] = position;
         }
		}

		x_edge1 = x - 500;
		x_edge2 = x + 500;
		y_edge1 = y - 250;
		y_edge2 = y + 250;

		if(x <= 500){
         x_edge1 = 0;
         x_edge_2 = 1000;
         me.style.left = 600 + (x - 500);
      }
      else if(x >= 1500){
         x_edge1 = 1000;
         x_edge2 = 2000;
         me.style.left = 600 + (x - 1500);
      }
      if(y <= 250){
         y_edge1 = 0;
         y_edge2 = 500;
         me.style.top = 300 + (y - 250);
      }
      else if(y >= 750){
         y_edge1 = 500;
         y_edge2 = 1000;
         me.style.top = 300 + (y - 750);
      }
      for(var i = 0; i < img.length; i += 4){
         if(map_init[y_edge1+Math.floor((i/4)/1000)][x_edge1+(i/4)%1000]>=0.7){ // map_init[??] >= 0.7
            img[i+3] = 255;
         }
         else{
            img[i+3] = 0;
         }
      }
      ctx.putImageData(imgData, 0, 0);

      //console.log("x1 = "+x_edge1+" x2 = "+x_edge2+" y1 = "+y_edge1+" y2 = "+y_edge2)
		for(var i in player_position){
			//console.log("position x = "+i.x+" y = "+i.y);
			if(player_position[i].x > x_edge1 && player_position[i].x < x_edge2 && player_position[i].y > y_edge1 && player_position[i].y < y_edge2){
				if(player_position[i].isGhost)
					ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, player_position[i].x - x_edge1, player_position[i].y - y_edge1, 50, 50);
				else
					ctx.drawImage(Img.human, 0, 0, Img.human.width, Img.human.height, player_position[i].x - x_edge1, player_position[i].y - y_edge1, 50, 50);
         }
         if(isCollide(player_position[i], x, y)){
            console.log(player_position[i],x,y);
            if(isGhost){
               score += 100;
               $("#scoreboard").text(score);
            }
            else{
               alert("gameover");
               //socket.emit("gameover");
               socket.disconnect();
               document.location.href = "/";
            }
         }
		}

	});
}

function isCollide(rect1, x, y) {
   return    rect1.x <= x + 50
         && rect1.x >= x - 50
         && rect1.y <= y + 50
         && rect1.y >= y - 50;
}

