
function startup() {

    $(".season-selector").click(select_season);

    $("#swapteams1").click(swap_teams);
    $("#swapteams2").click(swap_teams);
    $("#swapblue").click(swap_blue);
    $("#swapred").click(swap_red);
    $(".swapdefence").click(swap_defence);
    $(".swapattack").click(swap_attack);

    $("#balanceteams").click(balance_teams);

    $("#lockbluedef").click(toggle_lock("blue"));
    $("#lockblueatk").click(toggle_lock("blue"));
    $("#lockreddef").click(toggle_lock("red"));
    $("#lockredatk").click(toggle_lock("red"));


    $('#bluedef').change( function() { set_player('bluedef', $('#bluedef').val()); elo_prediction(); } );
    $('#blueatk').change( function() { set_player('blueatk', $('#blueatk').val()); elo_prediction(); } );
    $('#redatk').change(  function() { set_player('redatk',  $('#redatk').val()); elo_prediction(); } );
    $('#reddef').change(  function() { set_player('reddef',  $('#reddef').val()); elo_prediction(); } );

    // Hide start button
    // Only show it when connected to the balltracking system
    $('#btnstartgame').hide();
    initBalltracker(
        function() { // onOpen
            console.log("Connected to balltracker!");
            $('#btnstartgame').show();
        },
        function (e) { // onError
            console.log("Could not connct to balltracker!");
        },
        function (event) { // onMessage
            console.log("Message from balltracker: " + event.data);
        }
    );

    $('#eloModal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget) // Button that triggered the modal
        var pId = button.data('playerid');
        var pName = button.html();
        var recipient = button.data('playerid') // Extract info from data-* attributes
        // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
        // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
        var modal = $(this)
        modal.find('.modal-title').text('Rating history for ' + pName);
        $.getJSON( 'api/get_history.php?player_id=' + pId, function(data) {
            var chartdata = [[
                {label: 'Time', id: 'time'},
                {label: 'Defense rating', id: 'def_rating', type: 'number'},
                {label: 'Attack rating', id: 'atk_rating', type: 'number'} ]];

            var d = data['def_history']; // should be reference
            for(var i = 0; i < d.length; i++) {
                chartdata.push([ new Date(d[i][0]), d[i][1], null ]);
            }
            var d = data['atk_history']; // should be reference
            for(var i = 0; i < d.length; i++) {
                chartdata.push([ new Date(d[i][0]), null, d[i][1] ]);
            }
            var charttable = google.visualization.arrayToDataTable(chartdata);

            var options = {
                legend: { position: 'bottom' },
                chartArea:{left:40,top:10,width:'100%',height:160}
            };
            var chart = new google.visualization.LineChart(document.getElementById('line_chart'));
            chart.draw(charttable, options);
        });
    });

    
    $('#newplayerModal').on('shown.bs.modal', function() { $('#player-name').trigger('focus'); });

    $('#addplayerbutton').click(function () {
        var name = $('#player-name').val().trim();
        if (name == "") {
            $('#newplayerModal').modal('hide');
        } else {
            $.getJSON('api/add_player.php?name=' + encodeURI(name), function(data) {
                alert(data['result']);
                window.location.reload(false);
            });
            $('#newplayerModal').modal('hide');
        }
    });

    load_season_section(default_season_id);

    $('.playerselect').select2({matcher: matchStart});

    charts_loaded = false;
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(function(){ charts_loaded = true; });
}

function select_season() {
    alert('Not implemented yet!');
}

function toggle_lock(color){
    return function(){
        if($(this).hasClass("fa-lock-open")){ // lock is open and we're gonna close it
            $(this).attr("class", "fas fa-lock");
        }
        else if($(this).hasClass(color.concat("team"))){
            $(this).attr("class", "fas fa-lock-open");
        }
        else{
            $(this).attr("class", "fas fa-lock ".concat(color).concat("team"));
        }
    }
}

function load_season_section(season_id) {
    season_title = $(".season-selector[data-season-id=" + season_id + "]").text();
    $("#season-selected").text(season_title);

    
    $.getJSON( 'api/get_classification.php?season_id=' + season_id, function( data ) {
        // JSON arrays become normal javascript arrays
        // JSON key-value-pairs become javascript objects
        // which can be used with data["key"] or with
        //   $.each( data, function( key, val ) {
        //   });
        $('#bestattackers').append(data["bestattackers"]);
        $('#bestdefenders').append(data["bestdefenders"]);
        $('#classification').append(data["classification"]);
        $('#bluewins').append(data["bluewins"]);
        $('#redwins').append(data["redwins"]);
        $('#bluedef').html(data["playerlist"]);
        $('#blueatk').html(data["playerlist"]);
        $('#redatk').html(data["playerlist"]);
        $('#reddef').html(data["playerlist"]);
        $('#matches').append(data['recentmatches']);

        $('#bluedef').val(data['playerpositions']['bluedef']);
        $('#blueatk').val(data['playerpositions']['blueatk']);
        $('#redatk').val(data['playerpositions']['redatk']);
        $('#reddef').val(data['playerpositions']['reddef']);

        elo_prediction();
    });
};

//      Blue  Red
// (def) 1     3 (atk)
// (atk) 2     4 (def)

function swap_teams() {
    var a1 = $('#bluedef').val();
    var a2 = $('#blueatk').val();
    var a3 = $('#redatk').val();
    var a4 = $('#reddef').val();

    set_player('bluedef', a4);
    set_player('blueatk', a3);
    set_player('redatk',  a2);
    set_player('reddef',  a1);

    elo_prediction();
}
function swap_blue() {
    var a1 = $('#bluedef').val();
    var a2 = $('#blueatk').val();

    set_player('bluedef', a2);
    set_player('blueatk', a1);
    elo_prediction();
}
function swap_red() {
    var a3 = $('#redatk').val();
    var a4 = $('#reddef').val();

    set_player('redatk', a4);
    set_player('reddef', a3);
    elo_prediction();
}

function swap_defence() {
    var a1 = $('#bluedef').val();
    var a4 = $('#reddef').val();

    set_player('bluedef', a4);
    set_player('reddef', a1);
    elo_prediction();
}

function swap_attack() {
    var a2 = $('#blueatk').val();
    var a3 = $('#redatk').val();

    set_player('blueatk', a3);
    set_player('redatk', a2);
    elo_prediction();
}


// https://stackoverflow.com/a/20871714/9978001
const permutator = (inputArr) => {
    let result = [];

    const permute = (arr, m = []) => {
        if (arr.length === 0) {
            result.push(m)
        } else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice();
                let next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next))
            }
        }
    }

    permute(inputArr)

    return result;
}

function balance_teams(){
    var ids = [$('#bluedef').val(), $('#blueatk').val(), $('#redatk').val(), $('#reddef').val()];
    var atkratings =  {[ids[0]] : $('#bluedef').find(':selected').data('atkrating'),
                       [ids[1]] : $('#blueatk').find(':selected').data('atkrating'),
                       [ids[2]] : $('#redatk').find(':selected').data('atkrating'),
                       [ids[3]] : $('#reddef').find(':selected').data('atkrating')};
    var defratings = {[ids[0]] : $('#bluedef').find(':selected').data('defrating'),
                      [ids[1]] : $('#blueatk').find(':selected').data('defrating'),
                      [ids[2]] : $('#redatk').find(':selected').data('defrating'),
                      [ids[3]] : $('#reddef').find(':selected').data('defrating')}

    var perms = permutator(ids); 

    // filter permutations not satisfying locking contraints
    perms = perms.filter(function(elt){
        var pos = ["#lockbluedef", "#lockblueatk", "#lockredatk", "#lockreddef"];
        for(i in pos){
            if($(pos[i]).hasClass("fa-lock")){
                var team = pos[i].search("red") > -1 ? "redteam" : "blueteam";
                if($(pos[i]).hasClass(team)){
                    if(elt[i] != ids[i]) return false;
                }
                else{ // if index i is a defence then 3-i is also defence, same for attack
                    if(!(elt[i] == ids[i] || elt[3-i] == ids[i])) return false;
                }
            }
        }
        return true;
    });

    var smallestDifference = 2;
    for (i in perms){
        var perm = perms[i];
        var blueElo  = 0.565 * defratings[perm[0]]  + 0.435 * atkratings[perm[1]];
        var redElo  = 0.565 * defratings[perm[3]]  + 0.435 * atkratings[perm[2]];

        var blueValue = 1.0 / (1.0 + Math.pow(10, (redElo - blueElo) / 400.0));
        var redValue = 1.0 - blueValue;

        if(Math.abs(blueValue - redValue) < smallestDifference){
            smallestDifference = Math.abs(blueValue - redValue);
            ids = perm;
        }
    }

    set_player('bluedef', ids[0]);
    set_player('blueatk', ids[1]);
    set_player('redatk',  ids[2]);
    set_player('reddef',  ids[3]);

    // reset locks
    var pos = ["#lockbluedef", "#lockblueatk", "#lockredatk", "#lockreddef"];
    for(i in pos){
        $(pos[i]).attr("class", "fas fa-lock-open");
    }

    elo_prediction();
}

function set_player(position, player_id) {
    $('#'.concat(position)).val(player_id).trigger('change.select2');

    $.getJSON("api/set_players.php?" + position + "=" + player_id, function (data) {
        if (data['affectedrows'] != 1) {
            console.log("Warning: api/set_players.php?" + position + "=" + player_id + " returned: ");
            console.log(data);
        }
    });
}

function eloToPoints(eloValue) {
    if( eloValue < 0.5) {
        return Math.round(eloValue/(1-eloValue) * 10.0);
    }
    return 10;
}

function elo_prediction() {
    var redElo  = 0.565 * $('#reddef').find(':selected').data('defrating')  + 0.435 * $('#redatk').find(':selected').data('atkrating');
    var blueElo = 0.565 * $('#bluedef').find(':selected').data('defrating') + 0.435 * $('#blueatk').find(':selected').data('atkrating');

    var blueValue = 1.0 / (1.0 + Math.pow(10, (redElo - blueElo) / 400.0));
    var redValue = 1.0 - blueValue;

    $('#blueprediction').html("" + (Math.round(100.0 * blueValue)/100.0) + " (" + eloToPoints(blueValue) + " pts)");
    $( '#redprediction').html("" + (Math.round(100.0 *  redValue)/100.0) + " (" + eloToPoints( redValue) + " pts)");
}

// https://select2.org/searching
function matchStart (params, data) {
    if($.trim(params.term) === '') {
        return data;
    }
    if (data.text.toUpperCase().indexOf(params.term.toUpperCase()) == 0) {
        return data;
    }

    return null;
}

$(document).ready(startup)


