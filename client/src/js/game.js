// Game Constants Setting
var GHOST_ENERGY_RECOVER_PER_SECOND = 5;
var HUMAN_ENERGY_RECOVER_PER_SECOND = 10;
var HUMAN_ENERGY_INIT = 100;
var MAX_ENERGY = 100;
var Q_COST_ENERGY = 10;
var W_COST_ENERGY = 30;
var E_COST_ENERGY = 70;
var R_COST_ENERGY = 50;
var R_DISTANCE = 180;
var BOMB_RANGE = 150;

// Displaying Constansts
var WIDTH=500;
var HEIGHT=50;
var ENERGY_COLOR = '#FF6666';

//var server_ip = 'localhost';
var server_ip = '10.5.4.95';
var socket = io('//'+server_ip+':8000/game');

var map_width = 2100;
var map_height = 1100;
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
var block_size = 100;
var game_map = null;
var me;
var lastkey = 0;

//For volume detection & energy system
var mediaStreamSource = null;
var meter = null;
var speed_canvasContext = null;
var energy_canvasContext = null;


window.onload = function(){
    var box = document.getElementById("box");
    var ctx = box.getContext("2d");
    ctx.clearRect(0, 0, 1000, 500);
    var Img = {};
    Img.ghost = new Image();
    Img.ghost.src = "src/img/ghost.png";
    Img.human = new Image();
    Img.human.src = "src/img/human2.png";
    Img.floor = new Image();
    Img.floor.src = "src/img/floor.png";
    Img.wall1 = new Image();
    Img.wall1.src = "src/img/wall1.png";
    Img.wall2 = new Image();
    Img.wall2.src = "src/img/wall2.png";
    Img.wall3 = new Image();
    Img.wall3.src = "src/img/wall3.png";
    Img.explo1 = new Image();
    Img.explo1.src = "src/img/explo1.png";
    Img.bomb = new Image();
    Img.bomb.src = "src/img/bomb.png";
    width = $(window).width();
    height = $(window).height();

    /*This section is for volume recognizing */
    speed_canvasContext = document.getElementById( "speed" ).getContext("2d");
    energy_canvasContext = document.getElementById( "energy" ).getContext("2d");
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
        for(var i = 0; i < 11; i ++){
            for(var j = 0; j < 21; j ++){
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
        if(isGhost){
            me = Img.ghost;
            setInterval(function(){
                energy += GHOST_ENERGY_RECOVER_PER_SECOND;
                if (energy > MAX_ENERGY){
                    energy = MAX_ENERGY
                }
                update_energy_display();
            }, 1000);
        }else{
            me = Img.human;
            energy = HUMAN_ENERGY_INIT;
            setInterval(function(){
                energy += HUMAN_ENERGY_RECOVER_PER_SECOND;
                if (energy > MAX_ENERGY){
                    energy = MAX_ENERGY
                }
                update_energy_display();
            }, 1000);
        }
        console.log("init success!");
    });
    console.log('test');

    window.onkeydown = function(e){
        //ctx.clearRect(0, 0, 1000, 500);
        var update_pos = true;
        var skill = 0;
        //var speed = 50;
        var oldX = x, oldY = y;
        switch(e.keyCode){
            case 37:
                lastkey = 1;
                if(x >= block_size){ //505
                    x -= speed;
                }
                break;
            case 38:
                lastkey = 2;
                if(y >= block_size){ //255
                    y -= speed;
                }
                break;
            case 39:
                lastkey = 3;
                if(x <= map_width - block_size){ //1495
                    x += speed;
                }
                break;
            case 40:
                lastkey = 4;
                if(y <= map_height - block_size){ //745
                    y += speed;
                }
                break;
            case 81: // q
                if(energy >= Q_COST_ENERGY){
                    energy -= Q_COST_ENERGY;
                    update_energy_display();
                    skill = 1;
                    update_pos = false;
                }
                break;
            case 87: // w
                if(energy >= W_COST_ENERGY){
                    energy -= W_COST_ENERGY;
                    update_energy_display();
                    skill = 2;
                    update_pos = false;
                    break;
                }
            case 69: // e
                if(energy >= E_COST_ENERGY){
                    energy -= E_COST_ENERGY;
                    update_energy_display();
                    skill = 3;
                    update_pos = false;
                    break;
                }
            case 82: //r
                if(energy >= R_COST_ENERGY){
                  energy -= R_COST_ENERGY;
                  update_energy_display();
                  update_pos = false;
                  skill = 4;
                  flash();
                  break;
                }
        }
        if(update_pos){
            // Collision with wall
            while(map_init[y][x]>0 || map_init[y+50-1][x+50-1]>0 ||
                  map_init[y+50-1][x]>0 || map_init[y][x+50-1]>0){
                if(x > oldX){
                    x--;
                }else if(x < oldX){
                    x++;
                }
                if(y > oldY){
                    y--;
                }else if(y <oldY){
                    y++;
                }
            }
            socket.emit('newPosition', {x: x, y: y}, function(data){});
        }
        else{
            // skill!
            // TODO voice control skill
            // below is an example
            if(skill == 4){
                socket.emit('skill', {skill: skill, x:flash_x, y:flash_y}, function(data){});
            }else{
                socket.emit('skill', {skill: skill}, function(data){});
            }
        }
    }
    socket.on('newPosition', function(d){
        ctx.clearRect(0, 0, 1000, 500);
        var player_position = {};

        var data = d.pack;
        var danger_pos = d.danger_pos;
            //console.log(danger_pos);
        var explode_pos = d.explode_pos;
        var now_skill = 0;

        for(var i = 0; i < data.length; i++){
            if(id == data[i].id){
                x = data[i].x;
                y = data[i].y;
                now_skill = data[i].skill;
            }else{
                var position = {x:data[i].x, y:data[i].y, isGhost:data[i].isGhost, id:data[i].id, skill:data[i].skill};
                player_position[data[i].id] = position;
            }
        }
        getPosition(x, y);
        dead = 0;

        // Draw walls and floor
        for(var i = 0; i < 11; i ++){
            for(var j = 0; j < 21; j ++){
               var wallx = j*block_size, wally = i*block_size;
               if(wallx >= x_edge1 - block_size && wallx <= x_edge2 &&
                  wally >= y_edge1 - block_size && wally <= y_edge2 ){
                   var correct_wallx = wallx - x_edge1, correct_wally = wally - y_edge1;
                   var img_sel_x = 0, img_sel_y = 0;
                   if (correct_wallx<0){
                       img_sel_x = (x_edge1 - wallx)/100;
                       correct_wallx=0;
                   }
                   if (correct_wally<0){
                       img_sel_y = (y_edge1 - wally)/100;
                       correct_wally=0;
                   }
                   switch (game_map[i][j]){
                       case 0:
                           ctx.drawImage(Img.floor, img_sel_x*Img.floor.width, img_sel_y*Img.floor.height,
                                         Img.floor.width, Img.floor.height, correct_wallx,
                                         correct_wally, block_size, block_size);
                           break;
                       case 1:
                           ctx.drawImage(Img.wall1, img_sel_x*Img.wall1.width, img_sel_y*Img.wall1.height,
                                         Img.wall1.width, Img.wall1.height, correct_wallx,
                                         correct_wally, block_size, block_size);
                           break;
                       case 2:
                           ctx.drawImage(Img.wall2, img_sel_x*Img.wall2.width, img_sel_y*Img.wall2.height,
                                         Img.wall2.width, Img.wall2.height, correct_wallx,
                                         correct_wally, block_size, block_size);
                           break;
                       case 3:
                           ctx.drawImage(Img.wall3, img_sel_x*Img.wall3.width, img_sel_y*Img.wall3.height,
                                         Img.wall3.width, Img.wall3.height, correct_wallx,
                                         correct_wally, block_size, block_size);
                           break;
                    }
                }
            }
        }

        for (var j in danger_pos) {
            expx = danger_pos[j].x;
            expy = danger_pos[j].y;
            if(expx >= x_edge1 - 50 && expx <= x_edge2 &&
               expy >= y_edge1 - 50 && expy <= y_edge2 ){
                var correct_expx = expx - x_edge1, correct_expy = expy - y_edge1;
                   var img_sel_x = 0, img_sel_y = 0;
                   if (correct_expx<0){
                       img_sel_x = (x_edge1 - expx)/50;
                       correct_wallx=0;
                   }
                   if (correct_expy<0){
                       img_sel_y = (y_edge1 - expy)/50;
                       correct_wally=0;
                   }
                ctx.drawImage(Img.bomb, img_sel_x*Img.bomb.width, img_sel_y*Img.bomb.height,
                              Img.bomb.width, Img.bomb.height, correct_expx,
                              correct_expy, 50, 50);

            }
        }
        for (var j in explode_pos) {
            expx = explode_pos[j].x;
            expy = explode_pos[j].y;
            if(expx >= x_edge1 - 50 && expx <= x_edge2 &&
               expy >= y_edge1 - 50 && expy <= y_edge2 ){
                var correct_expx = expx - x_edge1, correct_expy = expy - y_edge1;
                var img_sel_x = 0, img_sel_y = 0;
                if (correct_expx<0){
                    img_sel_x = (x_edge1 - expx)/150;
                    correct_wallx=0;
                }
                if (correct_expy<0){
                    img_sel_y = (y_edge1 - expy)/150;
                    correct_wally=0;
                }
                ctx.drawImage(Img.explo1, img_sel_x*Img.explo1.width, img_sel_y*Img.explo1.height,
                              Img.explo1.width, Img.explo1.height, correct_expx-100,
                              correct_expy-100, 250, 250);
            }
        }

        var imgData = ctx.getImageData(0, 0, 1000, 500);
        var img = imgData.data;
        for(var i = 0; i < img.length; i += 4){
            my = y_edge1+Math.floor((i/4)/1000);
            mx = x_edge1+(i/4)%1000;
            for (var j in explode_pos) {
                exp_x = explode_pos[j].x;
                exp_y = explode_pos[j].y;
                if (inExplodeRange2(x, y, exp_x, exp_y)) dead = 1;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        
        // draw self
        if(now_skill != 2) ctx.drawImage(me, 0, 0, me.width, me.height, x_mypos, y_mypos, 50, 50);
        else{
            if(isGhost) ctx.drawImage(Img.human, 0, 0, Img.human.width, Img.human.height, x_mypos, y_mypos, 50, 50);
            else ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, x_mypos, y_mypos, 50, 50);
        }

        if (dead) {
            socket.disconnect();
            document.location.href = "/gameover";
        }
        for(var i in player_position){
            if(player_position[i].x > x_edge1 && player_position[i].x < x_edge2
               && player_position[i].y > y_edge1 && player_position[i].y < y_edge2){
                if(toDrawGhost(player_position[i].isGhost, player_position[i].skill)) {
                    ctx.drawImage(Img.ghost, 0, 0, Img.ghost.width, Img.ghost.height, player_position[i].x - x_edge1, player_position[i].y - y_edge1, 50, 50);
                } else{
                    ctx.drawImage(Img.human, 0, 0, Img.human.width, Img.human.height, player_position[i].x - x_edge1, player_position[i].y - y_edge1, 50, 50);
                }
            }
            if(isCollide(player_position[i], x, y)){
                console.log(player_position[i],x,y);
                if(isGhost && !(player_position[i].isGhost)){
                    energy = MAX_ENERGY;
                    update_energy_display();
                }
                else if(!(isGhost) && player_position[i].isGhost){
                    socket.disconnect();
                    document.location.href = "/gameover";
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
            speed_canvasContext.clearRect(0,0,WIDTH,HEIGHT);
            if (meter.checkClipping())
                speed_canvasContext.fillStyle = "#FFB366";
            else
                speed_canvasContext.fillStyle = "#2F6844";
            speed = 5+Math.floor(40*meter.volume);
            speed_canvasContext.fillRect(0, 0, speed*WIDTH/45, HEIGHT);
            $("#speedboard").text(speed);
        }
    });
}

function isCollide(rect1, x, y) {
   return   rect1.x <= x + 50
         && rect1.x >= x - 50
         && rect1.y <= y + 50
         && rect1.y >= y - 50;
}

function flash(){
    var current_x = x;
    var current_y = y;
    console.log("current x="+current_x+" y="+current_y);
    if (lastkey == 1) {
        for(var i = R_DISTANCE; i >= 0; i--){
            //console.log("left = "+map_init[current_y][current_x-i]+" right = "+map_init[current_y][current_x-i+50]+" left down = "+map_init[current_y+50][current_x-i]+" right down = "+map_init[current_y+50][current_x-i+50]);
            if(current_x-i<0)
            continue;
            if(map_init[current_y][current_x-i] == 0 && map_init[current_y][current_x-i+49] == 0 && map_init[current_y+49][current_x-i] == 0 && map_init[current_y+49][current_x-i+49] == 0){
                flash_x = current_x - i;
                flash_y = current_y;
                break;
            }
        }
    } else if(lastkey == 2) {
        for(var i = R_DISTANCE; i >= 0; i--) {
            if(current_y-i<0)
                continue;
            if(map_init[current_y-i][current_x] == 0 && map_init[current_y-i+49][current_x] == 0 && map_init[current_y-i+49][current_x+49] == 0 && map_init[current_y-i][current_x+49] == 0) {
                flash_x = current_x;
                flash_y = current_y - i;
                break;
            }
        }
    } else if(lastkey == 3) {
        for(var i = R_DISTANCE; i >= 0; i--){
            if(current_x+i+50>=map_width)
                continue;
            if(map_init[current_y][current_x+i] == 0 && map_init[current_y][current_x+i+49] == 0 && map_init[current_y+49][current_x+i] == 0 && map_init[current_y+49][current_x+i+49] == 0){
                flash_x = current_x + i;
                flash_y = current_y;
                break;
            }
        }
    }else{
        for(var i = R_DISTANCE; i >= 0; i--){
            if(current_y+i+50>=map_height)
                continue;
            if(map_init[current_y+i][current_x] == 0 && map_init[current_y+i+49][current_x] == 0 && map_init[current_y+i+49][current_x+49] == 0 && map_init[current_y+i][current_x+49] == 0){
                flash_x = current_x;
                flash_y = current_y + i;
                break;
            }
        }
    }
    console.log("flash to x="+flash_x+" y="+flash_y);

}
//Following part is for volume detection
// Reference : https://github.com/cwilso/volume-meter
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
        x_edge2 = 1000;
        x_mypos = x;
    }
    else if(x >= map_width- 500){
        x_edge1 = map_width-1000;
        x_edge2 = map_width;
        x_mypos = 500 + (x - (map_width - 500));
    }
    if(y <= 250){
        y_edge1 = 0;
        y_edge2 = 500;
        y_mypos = y;
    }
    else if(y >= map_height - 250){
        y_edge1 = map_height - 500;
        y_edge2 = map_height;
        y_mypos = 250 + (y - (map_height - 250));
    }
}

function inExplodeRange(x, y, exp_x, exp_y) {
    return exp_x <= x+50 && exp_y <= y+50 && exp_x >= x-100 && exp_y >= y-100;
}
function inExplodeRange2(x, y, exp_x, exp_y) {
    return exp_x <= x+BOMB_RANGE && exp_y <= y+BOMB_RANGE && exp_x >= x-BOMB_RANGE && exp_y >= y-BOMB_RANGE;
}

function update_energy_display(){
    $("#energyboard").text(energy);
    energy_canvasContext.clearRect(0,0,WIDTH,HEIGHT);
    energy_canvasContext.fillStyle = ENERGY_COLOR;
    energy_canvasContext.fillRect(0, 0, energy*WIDTH/170, HEIGHT);
}

function toDrawGhost(isGhost, skill) {
    return (isGhost && skill != 2) || (!isGhost && skill == 2);
}
