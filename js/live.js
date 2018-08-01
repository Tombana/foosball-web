var dateS = new Date();
var start_time;

function startup() {

  $.getJSON( 'api/get_players.php', function( data ) {
    $('#blueatk').html(data['blueatk']);
    $('#bluedef').html(data['bluedef']);
    $('#redatk').html(data['redatk']);
    $('#reddef').html(data['reddef']);
  });

//  setInterval(increaseScore, 500);
    start_time = dateS.getTime(); // in MILISECONDS since 01.01.1970 00:00:00
    
  $("#scoredBlue").click(increaseScoreBlue);
  $("#scoredRed").click(increaseScoreRed);
  $("#scoredBluemin").click(decreaseScoreBlue);
  $("#scoredRedmin").click(decreaseScoreRed);

  // Load all sound files
  sounds = { ballreset  : new Audio('sounds/BallReset.wav'),
             bluescores : new Audio('sounds/goal_blue/blue_team_scores.wav'),
             redscores  : new Audio('sounds/goal_red/red_team_scores.wav')
  };

  sounds.ballreset.play();

  initBalltracker();

}

function initBalltracker() {
  // Open a connection to the Balltracking program
  var ws = new WebSocket("ws://localhost:8420/");

  ws.onopen = function() {
    console.log("Connected to balltracker.");
    ws.send("Hello balltracker, how are you?");
  }

  ws.onmessage = function (event) {
    console.log("Message from balltracker: " + event.data);
    if (event.data == "BG") { // Blue Goal
      increaseScoreBlue();
    }
    if (event.data == "RG") { // Red Goal
      increaseScoreRed();
    }
  };

  ws.onerror = function(e) {
    console.log("Websocket error. Balltracker is probably not running. Error information:");
    console.log(e);
  }
}

$(document).bind('keydown',function(e){
//                 Keycodes: https://css-tricks.com/snippets/javascript/javascript-keycodes/
        if(e.keyCode == 65) {
            increaseScoreBlue();
        }
                 if(e.keyCode == 75) {
                 increaseScoreRed();
                 }
                 if(e.keyCode == 90) {
                 decreaseScoreBlue();
                 }
                 if(e.keyCode == 77) {
                 decreaseScoreRed();
                 }

});




function increaseScore() {
  var r = Math.random() >= 0.5;
  var s = r ? ($('#scorered')) : ($('#scoreblue'));
  var a = parseInt(s.html());
  s.html(a+1);
}

function increaseScoreBlue() {
    var s = ($('#scoreblue'));
    var t = ($('#scorered'));
    var a = parseInt(s.html());
    s.html(a+1);
    var b = parseInt(s.html());
    var r = parseInt(t.html());
    if (b==9 && r==9){
        s.html(8);
        t.html(8);
    }
sounds.bluescores.play();
    if (b==10){
        endgame();
        window.location.href="index.html";
    }
}
function increaseScoreRed() {
    var s = ($('#scoreblue'));
    var t = ($('#scorered'));
    var a = parseInt(t.html());
    t.html(a+1);
    var b = parseInt(s.html());
    var r = parseInt(t.html());
    if (b==9 && r==9){
        s.html(8);
        t.html(8);
    }
sounds.redscores.play();
    if (r==10){
        endgame();
        window.location.href="index.html";
    }
}
function decreaseScoreBlue() {
    var s = ($('#scoreblue'));
    var a = parseInt(s.html());
    if (a > 0)
        s.html(a-1);
}
function decreaseScoreRed() {
    var s = ($('#scorered'));
    var a = parseInt(s.html());
    if (a > 0)
        s.html(a-1);
}

function endgame(){
    var dateE = new Date();
    var end_time = dateE.getTime();
    var result = {};
    result["type"] = "quickmatch";
    result["players"] = [$('#bluedef').html(), $('#blueatk').html(), $('#redatk').html(), $('#reddef').html()];
    result["results"] = [parseInt($('#scoreblue').html()), parseInt($('#scorered').html())];
    result["start"] = Math.floor(start_time/1000);// time in SECONDS
    result["end"] = Math.floor(end_time/1000);// time in SECONDS
    var res = $.ajax('api/set_result.php',{ data: JSON.stringify(result),
                     contentType : 'application/json', type:'POST', async: false});
}

 
$(document).ready(startup)
