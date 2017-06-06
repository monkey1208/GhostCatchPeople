var Href = location.href;
socket = io.connect('//localhost:8000');
//socket.emit('init');
function join(){
	console.log("join");	
	document.location.href = Href+"game";
}
