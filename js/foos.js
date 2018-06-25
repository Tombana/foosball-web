function startup() {
	$(".season-selector").click(select_season);

    $("#swapteams1").click(swap_teams);
    $("#swapteams2").click(swap_teams);
    $("#swapblue").click(swap_blue);
    $("#swapred").click(swap_red);

    $('#bluedef').change( function() { set_player('bluedef', $('#bluedef').val()); elo_prediction(); } );
    $('#blueatk').change( function() { set_player('blueatk', $('#blueatk').val()); elo_prediction(); } );
    $('#redatk').change(  function() { set_player('redatk',  $('#redatk').val()); elo_prediction(); } );
    $('#reddef').change(  function() { set_player('reddef',  $('#reddef').val()); elo_prediction(); } );

    $('#exampleModal').on('show.bs.modal', function (event) {
      var button = $(event.relatedTarget) // Button that triggered the modal
      var pId = button.data('playerid');
      var pName = button.html();
      var recipient = button.data('playerid') // Extract info from data-* attributes
      // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
      // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
      var modal = $(this)
      modal.find('.modal-title').text('Rating history for ' + pName);
      var graphDiv = modal.find('.modal-graph');
      $.getJSON( 'backend/get_history.php?player_id=' + pId, function(data) {
          graphDiv.html("Does anyone know a simple Javascript library for creating a graph out of these data points??<br>Attack history:<br>" + data['atk_history'] + "<br>Defense history:<br>" + data['def_history']);
        //data['atk_history']
        //data['def_history']
      });
    })

    load_season_section(default_season_id);
}

function select_season() {
    alert('Not implemented yet!');
}

function load_season_section(season_id) {
	season_title = $(".season-selector[data-season-id=" + season_id + "]").text();
	$("#season-selected").text(season_title);

    $.getJSON( 'backend/get_classification.php?season_id=' + season_id, function( data ) {
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
    a1 = $('#bluedef').val();
    a2 = $('#blueatk').val();
    a3 = $('#redatk').val();
    a4 = $('#reddef').val();
    $('#bluedef').val(a4);
    $('#blueatk').val(a3);
    $('#redatk').val(a2);
    $('#reddef').val(a1);
    set_player('bluedef', a4);
    set_player('blueatk', a3);
    set_player('redatk',  a2);
    set_player('reddef',  a1);
    elo_prediction();
}
function swap_blue() {
    a1 = $('#bluedef').val();
    a2 = $('#blueatk').val();
    $('#bluedef').val(a2);
    $('#blueatk').val(a1);
    set_player('bluedef', a2);
    set_player('blueatk', a1);
    elo_prediction();
}
function swap_red() {
    a3 = $('#redatk').val();
    a4 = $('#reddef').val();
    $('#redatk').val(a4);
    $('#reddef').val(a3);
    set_player('redatk', a4);
    set_player('reddef', a3);
    elo_prediction();
}

function set_player(position, player_id) {
    $.getJSON("backend/set_players.php?" + position + "=" + player_id, function (data) {
        if (data['affectedrows'] != 1) {
            console.log("Warning: backend/set_players.php?" + position + "=" + player_id + " returned: ");
            console.log(data);
        }
    });
}

function eloToPoints(eloValue) {
    if( eloValue < 0.5) {
        return Math.round(eloValue * 20.0);
    }
    return 10;
}

function elo_prediction() {
    redElo  = 0.565 * $('#reddef').find(':selected').data('defrating')  + 0.435 * $('#redatk').find(':selected').data('atkrating');
    blueElo = 0.565 * $('#bluedef').find(':selected').data('defrating') + 0.435 * $('#blueatk').find(':selected').data('atkrating');

    blueValue = 1.0 / (1.0 + Math.pow(10, (redElo - blueElo) / 400.0));
    redValue = 1.0 - blueValue;

    $('#blueprediction').html("" + (Math.round(100.0 * blueValue)/100.0) + " (" + eloToPoints(blueValue) + " pts)");
    $( '#redprediction').html("" + (Math.round(100.0 *  redValue)/100.0) + " (" + eloToPoints( redValue) + " pts)");
}

$(document).ready(startup)
