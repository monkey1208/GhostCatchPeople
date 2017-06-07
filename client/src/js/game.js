var socket = io('//localhost:8000/game');
//socket.emit('init');

function setPosition(ctx, Img, data){
	for(var i = 0; i < data.length; i++){
		ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, data[i].x, data[i].y, 50, 50);
	}
}

function setKeyDown(){
	document.onkeydown = function(event){
		
		
	}
}

window.onload = function(){
	var Img = {};
	Img.ghost = new Image();
	Img.ghost.src = "src/img/ghost.jpg";
	var box = document.getElementById("box");
	var ctx = box.getContext("2d");
	socket.on('newPosition', function(data){
		ctx.clearRect(0, 0, 1000, 500);
		console.log('newposition');
		setPosition(ctx, Img, data);
	});
}

socket.on('init', function(data){
	socket.send('init');
});
