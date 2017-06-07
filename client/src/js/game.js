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

window.onload = function(){
   console.log(map_init);
	var Img = {};
	Img.ghost = new Image();
	Img.ghost.src = "src/img/ghost.jpg";
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
   ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, 0, 0, 1000, 500);
   var x = 500;
   var y = 250;
   window.onkeydown = function(e){
      ctx.clearRect(0, 0, 1000, 500);
      switch(e.keyCode){
         case 37:
            if(x != 0){
               x -= 5;
            }
            break;
         case 38:
            if(y != 0){
               y -= 5;
            }
            break;
         case 39:
            if(x != 1000){
               x += 5;
            }
            break;
         case 40:
            if(y != 500){
               y += 5;
            }
            break;
      }   
      //ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, x, y, 50, 50);
      var imgData = ctx.getImageData(0, 0, 1000, 500);
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
      ctx.putImageData(imgData, 0, 0);
   }
}

socket.on('init', function(data){
	socket.send('init');
});
