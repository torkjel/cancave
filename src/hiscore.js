function check_html5_localstorage() {
    if (!('localStorage' in window && window['localStorage'] !== null))
	throw new Exception("Local storage not supported!");
}

function ScoreTable() {
    this.scores = [];
    this.capacity = 10;
    this.load();
}

ScoreTable.prototype.addScore = function(score) {
    for (var i = 0; i < this.capacity; i++) {
	if (i >= this.scores.length) {
	    this.scores.push(score);
	    break;
	} else if (score.score > this.scores[i].score) {
	    this.scores.splice(i, 0, score);
	    break;
	}
    }
    if (this.scores.length > this.capacity)
	this.scores.pop();
    this.save();
}

ScoreTable.prototype.save = function() {
    check_html5_localstorage();
    var data = JSON.stringify(this);
    window.localStorage.hiscore = data;
}

ScoreTable.prototype.load = function() {
    check_html5_localstorage();
    if ('hiscore' in window.localStorage) {
	var data = window.localStorage.hiscore;
	var persisted = JSON.parse(data);
	this.scores = [];
	this.capacity = persisted.capacity;
	for (var i = 0; i < persisted.scores.length; i++) {
	    var score = persisted.scores[i];
	    this.scores.push(new Score(score.name, score.date, score.score));
	}
    }
}

function Score(name, date, score) {
    this.name = name;
    this.date = date;
    this.score = score;
}
