// Volume detection ref: https://github.com/cwilso/volume-meter/

var socket = io('//localhost:8000/game');
var map_init = new Array(1000);
/* TODO */
/* generate a reasonable map */

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
var width, height;
var speed = 30;

var mediaStreamSource = null;
var meter = null;

window.onload = function(){
	var Img = {};
	Img.ghost = new Image();
	Img.ghost.src = "src/img/ghost.jpg";
	Img.human = new Image();
	Img.human.src = "src/img/human.jpg";
	width = $(window).width();
    height = $(window).height();

    /*This section is for volume recognizing */
    // monkeypatch Web Audio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    // grab an audio context
    audioContext = new AudioContext();
    //Try to access microphone
    try{
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        navigator.getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }, gotStream, didntGetStream);
    } catch (e) {
        console.log("getUserMedia not supported");
        alert('getUserMedia threw exception :' + e);
    }

    /*Section ends */
   
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
	var box = document.getElementById("box");
	//box.style.width = width;
   //box.style.height = height;
   var ctx = box.getContext("2d");
	console.log('test');

	
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
		var update_pos = true;
        var skill = 0;
		switch(e.keyCode){
			case 37:
				if(x >= 10){ //505
					x -= speed;
				}
				break;
			case 38:
				if(y >= 10){ //255
					y -= speed;
				}
				break;
			case 39:
				if(x <= 1940){ //1495
					x += speed;
				}
				break;
			case 40:
				if(y <= 950){ //745
					y += speed;
				}
				break;
			case 81: // q
                skill = 1;
				update_pos = false;
				break;
			case 87: // w
                skill = 2;
				update_pos = false;
				break;
			case 69: // e
                skill = 3;
				update_pos = false;
				break;
				
		}	
		if(update_pos){
			socket.emit('newPosition', {x: x, y: y}, function(data){
			});
		}
		else{
			// skill!
			// TODO voice control skill
			// below is an example
			socket.emit('skill', {skill: skill}, function(data){});
		}
		
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
                if (data[i].skill == 2)
                    speed = 20;
                else
                    speed = 10;
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
         me.style.left = width/2 + (x - 500);
      }
      else if(x >= 1500){
         x_edge1 = 1000;
         x_edge2 = 2000;
         me.style.left = width/2 + (x - 1500);
      }
      if(y <= 250){
         y_edge1 = 0;
         y_edge2 = 500;
         me.style.top = 250 + (y - 250);
      }
      else if(y >= 750){
         y_edge1 = 500;
         y_edge2 = 1000;
         me.style.top = 250 + (y - 750);
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
               socket.disconnect();
               document.location.href = "/";
            }
         }
		}
      /* TODO */
      /* continually read incoming volume and tell if it is a skill, 
       * volume --> affect speed, */
       if(meter == null){
           console.log("mic unable now.");
       }
       else{
       	console.log("Current volume "+meter.volume);
       }
	});
}

function isCollide(rect1, x, y) {
   return    rect1.x <= x + 50
         && rect1.x >= x - 50
         && rect1.y <= y + 50
         && rect1.y >= y - 50;
}

//Following part is for volume detection

function didntGetStream() {
	console.log('Stream generation failed.');
    alert('Stream generation failed.');
}



function gotStream(stream) {
	console.log('Stream generation success.');
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Create a new volume meter and connect it.
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);
}

function createAudioMeter(audioContext,clipLevel,averaging,clipLag) {
	var processor = audioContext.createScriptProcessor(512);
	processor.onaudioprocess = volumeAudioProcess;
	processor.clipping = false;
	processor.lastClip = 0;
	processor.volume = 0;
	processor.clipLevel = clipLevel || 0.98;
	processor.averaging = averaging || 0.95;
	processor.clipLag = clipLag || 750;

	// this will have no effect, since we don't copy the input to the output,
	// but works around a current Chrome bug.
	processor.connect(audioContext.destination);

	processor.checkClipping =
		function(){
			if (!this.clipping)
				return false;
			if ((this.lastClip + this.clipLag) < window.performance.now())
				this.clipping = false;
			return this.clipping;
		};

	processor.shutdown =
		function(){
			this.disconnect();
			this.onaudioprocess = null;
		};

	return processor;
}

function volumeAudioProcess( event ) {
	var buf = event.inputBuffer.getChannelData(0);
    var bufLength = buf.length;
	var sum = 0;
    var x;

	// Do a root-mean-square on the samples: sum up the squares...
    for (var i=0; i<bufLength; i++) {
    	x = buf[i];
    	if (Math.abs(x)>=this.clipLevel) {
    		this.clipping = true;
    		this.lastClip = window.performance.now();
    	}
    	sum += x * x;
    }

    // ... then take the square root of the sum.
    var rms =  Math.sqrt(sum / bufLength);

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume*this.averaging);
}

