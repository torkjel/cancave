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

var canvas = null;
var context = null;
var color = 0;

var now = new Date();
var frameCount = 0;
var fps = 0;

var game = {
    ship : { 
	hspeed: 10,
	yspeed: 20,
	size: 10,
	thrust: 18, // g * 2
	xpos: 100,
	ypos: 300
	throttle = false
    },
    gravity : 9,
};

function time() {
    var next = new Date();
    if (now.getSeconds() != next.getSeconds()) {
	fps = frameCount;
	frameCount = 0;
	now = next;
    } else 
	frameCount++;

    context.fillStyle="#FFFFFF";
    context.fillText("FPS: " + fps, 10, 20);
}

function animate() {
    context.fillStyle="#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    color++;

    var ship = game.ship;
    context.fillStyle="#FF0000";
    context.fillRect(ship.xpos, ship.ypos, ship.size, ship.size);

    time();

    requestAnimFrame(function() {
        animate();
    });
}

window.onload=function() {
    canvas = document.getElementById("canvas");
    context =canvas.getContext("2d");
    animate();
}
