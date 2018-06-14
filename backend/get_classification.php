<?php
header("Content-Type: application/json; charset=UTF-8");

$pdo = new PDO("sqlite:foos.db");

$season_id = 1;
if (!empty($_REQUEST['season_id'])) {
    $season_id = $_REQUEST['season_id'];
}

$result = new stdClass(); // empty object in php
$result->season = $season_id;
$result->classification = "";
$result->bestattackers = "";
$result->bestdefenders = "";
$result->bluewins = 200;
$result->redwins = 200;
$result->playerlist = "";
$result->playerpositions = [];
$result->recentmatches = "";

// "classification":
for ($pos = 1; $pos <= 10; $pos++) {
    $result->classification .= '<tr>';
    $result->classification .= '    <td class="text-right">'. $pos        . '</td>';
    $result->classification .= '    <td class="text-left">' . "UnkownName". '</td>';
    $result->classification .= '    <td class="text-right">'. 10 .'/'. 20 . '</td>';
    $result->classification .= '    <td class="text-right">'. 1500 . '('. 10 .')</td>';
    $result->classification .= '    <td class="text-right">'. 1500 . '('. 10 .')</td>';
    $result->classification .= '</tr>';
}

// "bestattackers":
for ($pos = 1; $pos <= 10; $pos++) {
    $result->bestattackers .= '<tr>';
    $result->bestattackers .= '<td class="text-right">'. $pos         . '</td>';
    $result->bestattackers .= '<td class="text-left" >'. "UnkownName" . '</td>';
    $result->bestattackers .= '<td class="text-right">'. 1500         . '</td>';
    $result->bestattackers .= '<td class="text-right">'. 10           . '</td>';
    $result->bestattackers .= '</tr>';
}

// "bestdefenders":
for ($pos = 1; $pos <= 10; $pos++) {
    $result->bestdefenders .= '<tr>';
    $result->bestdefenders .= '<td class="text-right">'. $pos         . '</td>';
    $result->bestdefenders .= '<td class="text-left" >'. "UnkownName" . '</td>';
    $result->bestdefenders .= '<td class="text-right">'. 1500         . '</td>';
    $result->bestdefenders .= '<td class="text-right">'. 10           . '</td>';
    $result->bestdefenders .= '</tr>';
}

// "playerlist":
$q = $pdo->query('SELECT id,name FROM players ORDER BY name ASC');

$players = [];
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
    $players[$row['id']] = $row['name'];
    $result->playerlist .= '<option value="'. $row['id'] . '">' . $row['name'] . '</option>';
}

$q = $pdo->query("SELECT position,player_id FROM playerpositions");
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
    $result->playerpositions[$row['position']] = $row['player_id'];
}

// "recentmatches":
$q = $pdo->query('SELECT * FROM matches ORDER BY id DESC LIMIT 50');

$tbl = "";
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
    if ($row['scoreblue'] > $row['scorered']) {
        $blueclass = "winteam";
        $redclass = "loseteam";
    } else {
        $blueclass = "loseteam";
        $redclass = "winteam";
    }
    $red1 = '<b>';
    $tbl .= '<tr>';
    $tbl .= '<td>' . date('Y/m/d H:i',strtotime($row['time'])) . '</td>';
    $tbl .= '<td class="' . $blueclass . '">' . $players[$row['bluedef']] . ' (elo)</td>';
    $tbl .= '<td class="' . $blueclass . '">' . $players[$row['blueatk']] . ' (elo)</td>';
    $tbl .= '<td class="text-center">' . $row['scoreblue'] . '-' . $row['scorered'] . '</td>';
    $tbl .= '<td class="' . $redclass . '">' . $players[$row['redatk']] . ' (elo)</td>';
    $tbl .= '<td class="' . $redclass . '">' . $players[$row['reddef']] . ' (elo)</td>';
    //(<%= m.elos[0].to_s + (if m.elodiffs[0] >= 0 then "+" else "" end) + m.elodiffs[0].to_s %>)
    $tbl .= sprintf('<td class="text-center"> %02d:%02d</td>', floor($row['duration']/60) , $row['duration'] % 60);
    $tbl .= '<td class="text-center">-</td>';
//    <% m.replays.each do |r| %>
//        <a href="<%= r[:url] %>">At <%= r[:time].strftime("%H:%M") %></a> 
//    <% end %>
    $tbl .= '</tr>';
}
$result->recentmatches = $tbl;

echo json_encode($result);

?>
