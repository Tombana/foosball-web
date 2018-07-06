function startup() {

  $.getJSON( 'api/get_players.php', function( data ) {
    $('#blueatk').html(data['blueatk']);
    $('#bluedef').html(data['bluedef']);
    $('#redatk').html(data['redatk']);
    $('#reddef').html(data['reddef']);

  });

  setInterval(increaseScore, 500);
}

function increaseScore() {
  var r = Math.random() >= 0.5;
  var s = r ? ($('#scorered')) : ($('#scoreblue'));
  var a = parseInt(s.html());
  s.html(a+1);
}
 
$(document).ready(startup)
