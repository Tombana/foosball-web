var start_time;
var sounds;

var redScore;
var blueScore;

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

    blueScore = 0;
    redScore = 0;
    updateScore();

    // Play "Ball Reset" sound
    sounds.ballreset.play();

    // Set start time
    var dateS = new Date();
    start_time = dateS.getTime(); // in MILISECONDS since 01.01.1970 00:00:00

    console.log("Starting time: " + dateS.toTimeString());
}

function updateScore() {
    $('#scoreblue').html(blueScore);
    $('#scorered').html(redScore);
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
    blueScore++;
    updateScore();

    sounds.bluescores.play();
    showReplay();

    if (blueScore >= 10 && blueScore - redScore >= 2){
        endgame();
    }
}

function increaseScoreRed() {
    redScore++;
    updateScore();

    sounds.redscores.play();
    showReplay();

    if (redScore >= 10 && redScore - blueScore >= 2){
        endgame();
    }
}

function decreaseScoreBlue() {
    if (blueScore > 0)
        blueScore--;
    updateScore();
}
function decreaseScoreRed() {
    if (redScore > 0)
        redScore--;
    updateScore();
}

function endgame(){
    $('#message').html("Uploading result in 2 seconds...");
    setTimeout(function() {
        // Check if the user did not change the score back!
        if ((blueScore < 10 && redScore < 10) || Math.abs(blueScore - redScore) < 2) {
            $('#message').html("Upload cancelled!");
        } else {
            var dateE = new Date();
            var end_time = dateE.getTime();
            var result = {};
            result["type"] = "quickmatch";
            result["players"] = [$('#bluedef').html(), $('#blueatk').html(), $('#redatk').html(), $('#reddef').html()];
            result["results"] = [blueScore, redScore];
            result["start"] = Math.floor(start_time/1000);// time in SECONDS
            result["end"] = Math.floor(end_time/1000);// time in SECONDS
            var res = $.ajax('api/set_result.php',{ data: JSON.stringify(result),
                contentType : 'application/json', type:'POST', async: false});
            $('#message').html("Uploading...");
            setTimeout(function() {
                window.location.href="index.html";
            }, 1000);
        }
    }, 2000);
}

$(document).ready(startup)
