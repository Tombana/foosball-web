<?php
header("Content-Type: application/json; charset=UTF-8");
require 'elo.php';

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
$result->bluewins = 0;
$result->redwins = 0;
$result->playerlist = "";
$result->playerpositions = [];
$result->recentmatches = "";

// "playerlist":
$q = $pdo->query('SELECT id,name FROM players ORDER BY name ASC');

$players = [];
$abcPlayerIds = [];
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
    $players[$row['id']]['name'] = $row['name'];
    $abcPlayerIds[] = $row['id'];
    $result->playerlist .= '<option value="'. $row['id'] . '">' . $row['name'] . '</option>';
}

if (!empty($_REQUEST['elo'])) {
    $q = $pdo->query('SELECT * FROM matches ORDER BY id ASC');
    $allmatches = $q->fetchAll(PDO::FETCH_ASSOC);
    fullAnalysis($allmatches, $players, $pdo);
}

// "bluewins", "redwins"
$q = $pdo->query("SELECT key,value FROM statistics");
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
    if ($row['key'] == "bluewins")
        $result->bluewins = $row['value'];
    if ($row['key'] == "redwins")
        $result->redwins  = $row['value'];
}
// "classification":
$q = $pdo->query("SELECT * FROM player_ratings WHERE active = 1 ORDER BY player_id DESC");
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
    $players[$row['player_id']]['rating'] = $row;
}

$tbl = "";
foreach($abcPlayerIds as $id) {
    $rating = &$players[$id]['rating'];
    if(!empty($rating)) {
        $tbl .= '<tr>';
        $tbl .= '<td class="text-left" >'. $players[$id]['name'] . '</td>';
        $tbl .= '<td class="text-right">'. $rating['matches_won'] . '/' . $rating['num_matches'] . '</td>';
        $tbl .= '<td class="text-right">'. round($rating['atk_rating']) . '</td><td class="text-left">(' . $rating['atk_matches'] . ')</td>';
        $tbl .= '<td class="text-right">'. round($rating['def_rating']) . '</td><td class="text-left">(' . $rating['def_matches'] . ')</td>';
        $tbl .= '</tr>';
    }
}
$result->classification = $tbl;

// "bestattackers":
$pos = 1;
$tbl = "";
$q = $pdo->query("SELECT * FROM player_ratings WHERE active = 1 AND atk_matches >= 5 ORDER BY atk_rating DESC LIMIT 10");
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
    $tbl .= '<tr>';
    $tbl .= '<td class="text-right">'. $pos++ . '</td>';
    $tbl .= '<td class="text-left" >'. $players[$row['player_id']]['name'] . '</td>';
    $tbl .= '<td class="text-right">'. round($row['atk_rating'])  . '</td>';
    $tbl .= '<td class="text-right">'. $row['atk_matches'] . '</td>';
    $tbl .= '</tr>';
}
$result->bestattackers = $tbl;

// "bestdefenders":
$pos = 1;
$tbl = "";
$q = $pdo->query("SELECT * FROM player_ratings WHERE active = 1 AND def_matches >= 5 ORDER BY def_rating DESC LIMIT 10");
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
    $tbl .= '<tr>';
    $tbl .= '<td class="text-right">'. $pos++ . '</td>';
    $tbl .= '<td class="text-left" >'. $players[$row['player_id']]['name'] . '</td>';
    $tbl .= '<td class="text-right">'. round($row['def_rating'])  . '</td>';
    $tbl .= '<td class="text-right">'. $row['def_matches'] . '</td>';
    $tbl .= '</tr>';
}
$result->bestdefenders = $tbl;

// "playerpositions"
$q = $pdo->query("SELECT position,player_id FROM playerpositions");
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
    $result->playerpositions[$row['position']] = $row['player_id'];
}

// "recentmatches":
$q = $pdo->query('SELECT bluedef,blueatk,redatk,reddef,scoreblue,scorered,time,duration,
    bluedef_rating,bluedef_delta,blueatk_rating,blueatk_delta,
    redatk_rating,redatk_delta,reddef_rating,reddef_delta
    FROM matches INNER JOIN match_ratings ON matches.id = match_ratings.match_id
    ORDER BY id DESC LIMIT 10');

function printElo($value, $delta) {
    if ($delta >= 0)
        return ' (' . round($value) . '+' . round($delta) . ')';
    else
        return ' (' . round($value) . round($delta) . ')';
}

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
    $tbl .= '<td class="' . $blueclass . '">' . $players[$row['bluedef']]['name'] . printElo($row['bluedef_rating'], $row['bluedef_delta']) . '</td>';
    $tbl .= '<td class="' . $blueclass . '">' . $players[$row['blueatk']]['name'] . printElo($row['blueatk_rating'], $row['blueatk_delta']) . '</td>';
    $tbl .= '<td class="text-center">' . $row['scoreblue'] . '-' . $row['scorered'] . '</td>';
    $tbl .= '<td class="' . $redclass . '">' . $players[$row['redatk']]['name'] . printElo($row['reddef_rating'], $row['reddef_delta']) . '</td>';
    $tbl .= '<td class="' . $redclass . '">' . $players[$row['reddef']]['name'] . printElo($row['redatk_rating'], $row['redatk_delta']) . '</td>';
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
