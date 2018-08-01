function startup() {

  $.getJSON( 'api/get_players.php', function( data ) {
    $('#blueatk').html(data['blueatk']);
    $('#bluedef').html(data['bluedef']);
    $('#redatk').html(data['redatk']);
    $('#reddef').html(data['reddef']);
  });

  $("#scoredBlue").click(increaseScoreBlue);
  $("#scoredRed").click(increaseScoreRed);
  $("#scoredBluemin").click(decreaseScoreBlue);
  $("#scoredRedmin").click(decreaseScoreRed);

  initBalltracker();

  //  setInterval(increaseScore, 500);
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
        if(e.keyCode == 65) {
            increaseScoreBlue();
        }
});
$(document).bind('keydown',function(e){
                 if(e.keyCode == 75) {
                 increaseScoreRed();
                 }
                 });
$(document).bind('keydown',function(e){
                 if(e.keyCode == 90) {
                 decreaseScoreBlue();
                 }
                 });
$(document).bind('keydown',function(e){
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
//    if (b==10)
//        ADD GAME RESULT TO THE DB
//    link to go back to index: window.location.href="index.html";
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

//function endgame(bluedef, blueatk, reddef, redatk, bluescore, redscore){
//
//}

 
$(document).ready(startup)
