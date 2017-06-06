var socket = io('//localhost:8000');
//socket.emit('init');
window.onload = function(){
	var Img = {};
	Img.ghost = new Image();
	Img.ghost.src = "src/img/ghost.jpg";
	var box = document.getElementById("box");
	var ctx = box.getContext("2d");
	console.log('test');
	socket.on('newPosition', function(data){
		ctx.clearRect(0, 0, 1000, 500);
		console.log('newposition');
		for(var i = 0; i < data.length; i++){
			ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, data[i].x, data[i].y, 50, 50);
		}
	});
}
socket.on('init', function(data){
	socket.send('init');
});
