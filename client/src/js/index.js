var Href = location.href;
socket = io.connect('//10.5.7.155:8000');
//socket.emit('init');
function join(){
	console.log("join");
	document.location.href = Href+"game";
}
function monitor(){
	console.log("monitor");
	document.location.href = Href+"monitor";
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
