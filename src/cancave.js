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
	    yspeed: 5,
	    xspeed : 0.3,
	    size: 10,
	    thrust: 0.01,
	    xpos: 200,
	    ypos: 250,
	    throtle: false,
	    tail: [[0, 250]]
	},
	gravity : -0.01,
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
	points: 0,
	start_time: 0,
	time: 0,
	avgTpf: 0,
	tpf: []
    };
}

function moveShip(distance) {
    var ship = game.ship;

    // update tail
    ship.tail.push([ship.xpos, ship.ypos]);
    for (var i = 0; i < ship.tail.length; i++) {
	ship.tail[i][0] -= distance;
    }
    while (ship.tail.length > 1 && ship.tail[1][0] < 0) {
	ship.tail.shift();
    }

    // Update ship vertical position and speed
    ship.yspeed += (ship.throtle ? ship.thrust : game.gravity) * game.avgTpf;
    ship.ypos -= ship.yspeed;
}

function moveCave(distance) {
    // Move cave
    var ship = game.ship;
    var ceil = game.cave.ceiling;
    for (var i = 0; i < ceil.length; i++) {
	ceil[i][0] -= distance;
    }
    var floor = game.cave.floor;
    for (var i = 0; i < floor.length; i++) {
	floor[i][0] -= distance;
    }

    // Generate next cave segment
    game.cave.divisor += game.cave.falloff;
    game.cave.height = game.cave.min_height + (game.cave.max_height - game.cave.min_height) * (game.cave.max_height - game.cave.min_height) / game.cave.divisor;
    var minlen = game.cave.min_segment_len;
    var maxlen = game.cave.max_segment_len;
    if (ceil[ceil.length-1][0] < canvas.width) {
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

function move() {
    var distance = game.avgTpf * game.ship.xspeed;;
    moveShip(distance);
    moveCave(distance);
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

function drawShip() {
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
}

function drawCave() {
    var cave = game.cave;
    drawTerrain([0,0], [canvas.width, 0], cave.ceiling);
    drawTerrain([0,canvas.height], [canvas.width, canvas.height], cave.floor);
}

function drawTerrain(start, end, path) {
    context.fillStyle="#0000AA";
    context.beginPath();
    context.moveTo(start[0],start[1]);
    context.lineTo(path[0][0], path[0][1]);
    for (var i = 1; i < path.length; i++) {
	context.lineTo(path[i][0], path[i][1]);
    }
    context.lineTo(end[0], end[1]);
    context.closePath();
    context.fill();
}

function drawStatus() {
    context.fillStyle="#FFFFFF";
    context.fillText("FPS: " + fps, 10, 20);
    context.fillText("Throtle: " + game.ship.throtle, 10, 30);
    context.fillText("Speed: " + game.ship.yspeed, 10, 40);
    context.fillText("Pos: " + game.ship.ypos, 10, 50);
    context.fillText("Segments: " + game.cave.ceiling.length, 10, 60);
    context.fillText("Points: " + game.points, 10, canvas.height - 20);
    context.fillText("Height: " + game.cave.height, 10, 70);
}

function tick() {
    var next = new Date();
    if (now.getSeconds() != next.getSeconds()) {
	fps = frameCount;
	frameCount = 0;
	now = next;
    } else
	frameCount++;

    var time = game.start_time - next.getTime();
    game.tpf.push(game.time - time);
    while (game.tpf.length > 30)
	game.tpf.shift();
    var sum = 0;
    for (var i = 0; i < game.tpf.length; i++)
	sum += game.tpf[i];
    game.avgTpf = sum / game.tpf.length;
    game.time = time;
    game.points = time;
}

function start() {
    game.mode = "play";
    game.start_time = new Date().getTime();
    animate();
}

function animate() {
    context.fillStyle="#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (game.mode == "play") {
	tick();
	move();
    }

    drawCave();
    drawShip();
    drawStatus();

    if (crashed())
	game.mode = "dead";

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
	    start();
	} else if (game.mode == "dead") {
	    game = initGame();
	    start();
	}
    }
}

function keyUp(event) {
    if (event.keyCode == SPACE)
	game.ship.throtle = false;
}
