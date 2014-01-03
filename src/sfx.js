function Sfx() {
    if (this.initContext()) {
	var sfx = this;
	// 187409__mazk1985__robot-go.wav by mazk1985
	// http://www.freesound.org/people/mrmacross/sounds/186896/
	this.load("187409__mazk1985__robot-go.wav", function(sample) { sfx.goSample = sample; });
	// 186896__mrmacross__negativebuzz.mp3 by mrmacross,
	// http://www.freesound.org/people/mrmacross/sounds/186896/
	this.load("186896__mrmacross__negativebuzz.mp3", function(sample) { sfx.failSample = sample; });
    }
}

Sfx.prototype.initContext = function() {
    try {
	window.AudioContext = window.AudioContext||window.webkitAudioContext;
	this.context = new AudioContext();
    } catch(e) {
	console.log("AutiondContext now supported?");
	console.log(e);
    }
    return this.context;
}


Sfx.prototype.load = function(name, loaded) {
    var request = new XMLHttpRequest();
    request.open('GET', name, true);
    request.responseType = 'arraybuffer';

    var context = this.context;
    // Decode asynchronously
    request.onload = function() {
	context.decodeAudioData(
	    request.response,
	    loaded,
	    function() {
		console.log("failed to decode " + name);
	    }
	);
    }
    request.send();
}

Sfx.prototype.go = function() {
    this.play(this.goSample);
}

Sfx.prototype.fail = function() {
    this.play(this.failSample);
}

Sfx.prototype.play = function(sample) {
    if (!sample)
	return;
    var source = this.context.createBufferSource();
    source.buffer = sample;
    source.connect(this.context.destination);
    source.start(0);
}
