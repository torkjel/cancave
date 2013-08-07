window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame
	|| window.webkitRequestAnimationFrame
	|| window.mozRequestAnimationFrame
	|| window.oRequestAnimationFrame
	|| window.msRequestAnimationFrame
	|| function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

const SPACE = 32;
const ENTER = 13;

var canvas = null;
var context = null;

var now = new Date();
var frameCount = 0;
var fps = 0;

var game = initGame();

function initGame() {
    return {
	mode : "welcome",
	ship : {
	    hspeed: 10,
	    yspeed: 50,
	    xspeed : 5,
	    size: 10,
	    thrust: 1.4,
	    xpos: 200,
	    ypos: 250,
	    throtle: false,
	    tail: []
	},
	gravity : -1.4,
	cave : {
	    ceiling : [[0, 50], [300, 50], [600, 50],  [800, 50]],
	    floor : [[0, 350], [300, 350], [600, 350], [800, 350]],
	    max_height: 300,
	    min_height: 50,
	    divisor: 250,
	    falloff: 0.2,
	    min_segment_len: 50,
	    max_segment_len: 500,
	    max_inclination: 0.7
	},
	points: 0
    };
}

function time() {
    var next = new Date();
    if (now.getSeconds() != next.getSeconds()) {
	fps = frameCount;
	frameCount = 0;
	now = next;
    } else
	frameCount++;

    game.points++;

    context.fillStyle="#FFFFFF";
    context.fillText("FPS: " + fps, 10, 20);
    context.fillText("Throtle: " + game.ship.throtle, 10, 30);
    context.fillText("Speed: " + game.ship.yspeed, 10, 40);
    context.fillText("Pos: " + game.ship.ypos, 10, 50);
    context.fillText("Segments: " + game.cave.ceiling.length, 10, 60);
    context.fillText("Points: " + game.points, 10, canvas.height - 20);
    context.fillText("Height: " + game.cave.height, 10, 70);
}

function move() {
    var ship = game.ship;

    // Update ship vertival position and speed
    ship.tail.push([ship.xpos, ship.ypos]);
    ship.ypos -= (ship.yspeed / 10);
    ship.yspeed += ship.throtle ? ship.thrust : game.gravity;

    // Move cave
    var ceil = game.cave.ceiling;
    for (var i = 0; i < ceil.length; i++) {
	ceil[i][0] -= ship.xspeed;
    }
    var floor = game.cave.floor;
    for (var i = 0; i < floor.length; i++) {
	floor[i][0] -= ship.xspeed;
    }
    for (var i = 0; i < ship.tail.length; i++) {
	ship.tail[i][0] -= ship.xspeed;
    }
    while (ship.tail[0][0] < 0) {
	ship.tail.shift();
    }

    // Generate next cave segment
    game.cave.divisor += game.cave.falloff;
    game.cave.height = game.cave.min_height + (game.cave.max_height - game.cave.min_height) * (game.cave.max_height - game.cave.min_height) / game.cave.divisor;
    var minlen = game.cave.min_segment_len;
    var maxlen = game.cave.max_segment_len;
    while (ceil[ceil.length-1][0] < canvas.width) {
	var prevCenter = ceil[ceil.length - 1][1] + (floor[ceil.length - 1][1] - ceil[ceil.length - 1][1]) / 2;
	var prevX = ceil[ceil.length - 1][0];
	var nextX = ceil[ceil.length - 1][0] + minlen + Math.random() * (maxlen - minlen);
	var nextCenter = (Math.random() - 0.5) * 2 * canvas.height + (canvas.height / 2);
	var inclination = (nextCenter - prevCenter) / (nextX - prevX);
	if (Math.abs(inclination) > game.cave.max_inclination) {
	    nextCenter = prevCenter + (nextX - prevX) * game.cave.max_inclination * (inclination > 0 ? 1 : -1);
	}
	if ((nextCenter + game.cave.height / 2) > canvas.height) {
	    nextCenter = canvas.height - game.cave.height/2;
	}
	if ((nextCenter - game.cave.height / 2) < 0) {
	    nextCenter = game.cave.height/2
	}

	ceil.push([nextX, nextCenter - game.cave.height / 2]);
	floor.push([nextX, nextCenter + game.cave.height / 2]);
    }

    // Delete old cave segment
    if (ceil[0][0] < 0 && ceil[1][0] < 0) {
	ceil.shift();
	floor.shift();
    }
}

function crashed() {
    var ship = game.ship;
    return clearing(ship.xpos, ship.ypos, game.cave.ceiling) < 0
	|| clearing(ship.xpos, ship.ypos, game.cave.floor) > 0;
}

function clearing(xpos, ypos, curve) {
    for (var i = 0; i < curve.length - 1; i++) {
	 if (curve[i][0] <= xpos && curve[i+1][0] >= xpos) {
	     var hgt = curve[i+1][1] - curve[i][1];
	     var wdt = curve[i+1][0] - curve[i][0];
	     var dy = hgt / wdt;
	     var y = curve[i][1] + dy * (xpos - curve[i][0]);
	     return ypos - y;
	 }
    }
    throw new Exception("Bad curve");
}

function animate() {
    context.fillStyle="#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var ship = game.ship;
    context.fillStyle="#FF0000";
    context.beginPath();
    context.moveTo(ship.xpos, ship.ypos - ship.size/2);
    context.lineTo(ship.xpos, ship.ypos + ship.size/2);
    for (var i = ship.tail.length - 1; i >= 0 ; i--) {
	context.lineTo(ship.tail[i][0], ship.tail[i][1] + ship.size/2);
    }
    for (var i = 0; i < ship.tail.length; i++) {
	context.lineTo(ship.tail[i][0], ship.tail[i][1] - ship.size/2);
    }
    context.closePath();
    context.fill();


    var cave = game.cave;
    var ceil = cave.ceiling;
    context.fillStyle="#0000FF";
    context.beginPath();
    context.moveTo(0,0);
    context.lineTo(ceil[0][0], ceil[0][1]);
    for (var i = 1; i < ceil.length; i++) {
	context.lineTo(ceil[i][0], ceil[i][1]);
    }
    context.lineTo(canvas.width, 0);
    context.closePath();
    context.fill();

    var floor = cave.floor;
    context.fillStyle="#0000AA";
    context.beginPath();
    context.moveTo(0,canvas.height);
    context.lineTo(floor[0][0], floor[0][1]);
    for (var i = 1; i < floor.length; i++) {
	context.lineTo(floor[i][0], floor[i][1]);
    }
    context.lineTo(canvas.width, canvas.height);
    context.closePath();
    context.fill();

    time();

    if (crashed())
	game.mode = "dead";

    move();

    if (game.mode == "play") {
	requestAnimFrame(function() {
            animate();
	});
    } else if (game.mode == "welcome") {
	context.fillStyle="#FFFFFF";
	context.fillText("Welcome to the CanCave", 120, 200);
	context.fillText("Press <enter> to start", 120, 220);
    } else if (game.mode == "dead") {
	context.fillStyle="#FFFFFF";
	context.fillText("You died!", 120, 200);
	context.fillText("Press <enter> to restart", 120, 220);
    }
}

window.onload=function() {
    canvas = document.getElementById("canvas");
    context =canvas.getContext("2d");
    animate();
}

function keyDown(event) {
    if (event.keyCode == SPACE)
	game.ship.throtle = true;
    if (event.keyCode == ENTER) {
	if (game.mode == "welcome") {
	    game.mode = "play";
	    animate();
	} else if (game.mode == "dead") {
	    game = initGame();
	    game.mode = "play";
	    animate();
	}
    }
}

function keyUp(event) {
    if (event.keyCode == SPACE)
	game.ship.throtle = false;
}
