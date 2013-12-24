function has_html5_localstorage() {
    return 'localStorage' in window && window['localStorage'] !== null;
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
    var data = JSON.stringify(this);
    if (has_html5_localstorage())
	window.localStorage.hiscore = data;
    else
	document.cookie = "hiscore=" + escape(data);
}

ScoreTable.prototype.load = function() {
    var data = null;
    if (has_html5_localstorage()) {
	if ('hiscore' in window.localStorage)
	    data = window.localStorage.hiscore;
    } else {
	var cookies = document.cookie.split(';');
	for(var i = 0;  i < cookies.length; i++) {
	    var c = cookies[i].trim();
	    if (c.indexOf("hiscore=") == 0)
		data = unescape(c.substring("hiscore=".length, c.length));
	}
    }

    if (data) {
	var jsonData = JSON.parse(data);
	this.scores = [];
	this.capacity = jsonData.capacity;
	for (var i = 0; i < jsonData.scores.length; i++) {
	    var score = jsonData.scores[i];
	    this.scores.push(new Score(score.name, score.date, score.score));
	}
    }
}

function Score(name, date, score) {
    this.name = name;
    this.date = date;
    this.score = score;
}
