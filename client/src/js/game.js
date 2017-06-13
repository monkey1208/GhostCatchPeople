var socket = io('//localhost:8000/game');

var map_width = 2050;
var map_height = 1050;
var map_init = new Array(map_height);
for(var i = 0; i < map_height; i ++){
    map_init[i] = new Array(map_width);
}

var x = 500, y = 250;
var x_edge1 = 0, x_edge2 = 1000;
var y_edge1 = 0, y_edge2 = 500;
var x_mypos = 500, y_mypos = 250;
var id, isGhost;
var score = 0;
var width, height;
var speed = 30;
var block_size = 50;
var game_map;
var me;

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
       game_map = data.game_map
       for(var i = 0; i < 21; i ++){
           for(var j = 0; j < 41; j ++){
               for(var k = 0; k<block_size; k ++){
                   for(var l = 0; l<block_size; l ++){
                       map_init[i*block_size+k][j*block_size+l] = game_map[i][j]
                   }
               }
           }
        }
        x = data.x;
        y = data.y;
        id = data.id;
        isGhost = data.isGhost;
        if(isGhost)
            me = Img.ghost;
        else{
            me = Img.human;
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

    window.onkeydown = function(e){
        //ctx.clearRect(0, 0, 1000, 500);
        var update_pos = true;
        var skill = 0;
        //var speed = 50;
        var oldX = x, oldY = y;
        switch(e.keyCode){
            case 37:
                if(x >= 50){ //505
                    x -= speed;
                }
                break;
            case 38:
                if(y >= 50){ //255
                    y -= speed;
                }
                break;
            case 39:
                if(x <= 2000){ //1495
                    x += speed;
                }
                break;
            case 40:
                if(y <= 1000){ //745
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
            // Collision with wall
            if(map_init[y][x]>0 || map_init[y+block_size-1][x+block_size-1]>0){
                x = oldX;
                y = oldY;
            }
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
    socket.on('newPosition', function(d){
        var imgData = ctx.getImageData(0, 0, 1000, 500);
        var img = imgData.data;
        ctx.clearRect(0, 0, 1000, 500);
        var player_position = {};
        
        var data = d.pack;
        var danger_pos = d.danger_pos;
            //console.log(danger_pos);
        var explode_pos = d.explode_pos;

        for(var i = 0; i < data.length; i++){
            if(id == data[i].id){
                x = data[i].x;
                y = data[i].y;
            }else{
                var position = {x:data[i].x, y:data[i].y, isGhost:data[i].isGhost, id:data[i].id};
                player_position[data[i].id] = position;
            }
        }
        getPosition(x, y); 
        for(var i = 0; i < img.length; i += 4){
            my = y_edge1+Math.floor((i/4)/1000);
            mx = x_edge1+(i/4)%1000;
            if(map_init[my][mx]>=0.7){ // map_init[??] >= 0.7
                img[i] = 0;
                img[i+1] = 0;
                img[i+2] = 0;
                img[i+3] = 255;
            } else{
                img[i+3] = 0;
            }
            for (var j in danger_pos) {
                exp_x = danger_pos[j].x;
                exp_y = danger_pos[j].y;
                if (inExplodeRange(mx, my, exp_x, exp_y)) {
                    img[i] = 255;
                    img[i+1] = 153;
                    img[i+2] = 0;
                    img[i+3] = 255;
                }
            }
            for (var j in explode_pos) {
                exp_x = explode_pos[j].x;
                exp_y = explode_pos[j].y;
                if (inExplodeRange(mx, my, exp_x, exp_y)) {
                    img[i] = 255;
                    img[i+1] = 0;
                    img[i+2] = 0;
                    img[i+3] = 255;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
        ctx.drawImage(me, 0, 0, me.width, me.height, x_mypos, y_mypos, 50, 50);

        for(var i in player_position){
            if(player_position[i].x > x_edge1 && player_position[i].x < x_edge2 
               && player_position[i].y > y_edge1 && player_position[i].y < y_edge2){
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
           console.log("Mic is not avialible yet.");
       }
       else{
           speed = 5+Math.floor(40*meter.volume);
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

function getPosition(x, y){
   x_edge1 = x - 500;
   x_edge2 = x + 500;
   y_edge1 = y - 250;
   y_edge2 = y + 250;
   x_mypos = 500;
   y_mypos = 250;

   if(x <= 500){
      x_edge1 = 0;
      x_edge_2 = 1000;
      x_mypos = x;
   }
   else if(x >= 1550){
      x_edge1 = 1050;
      x_edge2 = 2050;
      x_mypos = 500 + (x - 1550);
   }
   if(y <= 250){
      y_edge1 = 0;
      y_edge2 = 500;
      y_mypos = y;
   }
   else if(y >= 800){
      y_edge1 = 550;
      y_edge2 = 1050;
      y_mypos = 250 + (y - 800);
   }
}

function inExplodeRange(x, y, exp_x, exp_y) {
    return exp_x <= x+50 && exp_y <= y+50 && exp_x >= x-100 && exp_y >= y-100;
}
