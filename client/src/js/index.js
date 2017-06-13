var Href = location.href;
socket = io.connect('//localhost:8000');
//socket.emit('init');
function join(){
	console.log("join");	
	document.location.href = Href+"game";
}
function switchContent(id){
   if(id == 1){
      $("#content2").hide();
      $("#content1").slideToggle();
   }
   else if(id == 2){
      $("#content1").hide();
      $("#content2").slideToggle();
   }
}
