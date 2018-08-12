var start_time;
var sounds;

function randomChoice(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

function startup() {
    // Load player names
    $.getJSON( 'api/get_players.php', function( data ) {
        $('#blueatk').html(data['blueatk']);
        $('#bluedef').html(data['bluedef']);
        $('#redatk').html(data['redatk']);
        $('#reddef').html(data['reddef']);
    });

    // Initialize buttons
    $("#scoredBlue").click(increaseScoreBlue);
    $("#scoredRed").click(increaseScoreRed);
    $("#scoredBluemin").click(decreaseScoreBlue);
    $("#scoredRedmin").click(decreaseScoreRed);

    // Load all sound files
    sounds = { ballreset  : new Audio('sounds/BallReset.wav'),
        bluescores : new Audio('sounds/goal_blue/blue_team_scores.wav'),
        redscores  : new Audio('sounds/goal_red/red_team_scores.wav'),
        nicecatch  : new Audio('sounds/blocks_saves/nicecatch.wav'),
        narrowlyaverted : new Audio('sounds/blocks_saves/Narrowly_Averted.wav'),
        woopwoop   : new Audio('sounds/woop_woop.wav')
    };

    // Connect to balltracking system
    // and start camera when connected
    initBalltracker(
        function() { // onOpen
            console.log("Connected to balltracker!");
            startCamera();

            // Send heartbeat every 2 s
            setInterval( function() {
                if (websocket.readyState == websocket.OPEN)
                    websocket.send("heartbeat");
            },
            2000);
        },
        function (e) { // onError
            console.log("Could not connct to balltracker! Error information:");
            console.log(e);
        },
        function (event) { // onMessage
            console.log("Message from balltracker: " + event.data);
            if (event.data == "BG") { // Blue Goal
                increaseScoreBlue();
            }
            if (event.data == "RG") { // Red Goal
                increaseScoreRed();
            }
            if (event.data == "FAST") { // Fast ball ?
                sounds.woopwoop.play();
            }
            if (event.data == "SAVE") { // Save by defense
                randomChoice( [sounds.nicecatch , sounds.narrowlyaverted] ).play();
            }
        }
    );

    // Play "Ball Reset" sound
    sounds.ballreset.play();

    // Set start time
    var dateS = new Date();
    start_time = dateS.getTime(); // in MILISECONDS since 01.01.1970 00:00:00

    console.log("Starting time: " + dateS.toTimeString());
}

$(document).bind('keydown',function(e){
    // Keycodes: https://css-tricks.com/snippets/javascript/javascript-keycodes/
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
    showReplay();

    if (b==10){
        endgame();
        // TODO: Sleep about 5 seconds before going back to main page
        //window.location.href="index.html";
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
    if (websocket.readyState == websocket.OPEN)
        websocket.send("replay");

    if (r==10){
        endgame();
        // TODO: Sleep about 5 seconds before going back to main page
        //    window.location.href="index.html";
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
