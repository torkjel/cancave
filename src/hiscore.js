
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
    if (hs_utils.hasLocalstorage())
	window.localStorage.hiscore = data;
    else
	document.cookie = "hiscore=" + escape(data);
}

ScoreTable.prototype.load = function() {
    var data = null;
    if (hs_utils.hasLocalstorage()) {
	if ('hiscore' in window.localStorage)
	    data = window.localStorage.hiscore;
    } else {
	data = hs_utils.getCookie('hiscore');
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

var hs_utils = new function() {
    this.getCookie = function(name) {
	var nameEq = name + '=';
	var data = null;
	var cookies = document.cookie.split(';');
	for(var i = 0;  i < cookies.length; i++) {
	    var c = cookies[i].trim();
	    if (c.indexOf(nameEq) == 0)
		data = unescape(c.substring(nameEq.length, c.length));
	}
	return data;
    }

    this.hasLocalstorage = function() {
	return 'localStorage' in window && window['localStorage'] !== null;
    }
};
