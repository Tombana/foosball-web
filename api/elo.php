<?php
//
// Recompute all ratings
//
require 'db.php';

// Map scores to a number in [0,1]
function scoreToValue($scoreblue, $scorered) {
    if ($scoreblue == $scorered)
        return 0.5;

    if ($scoreblue < $scorered)
        return $scoreblue / 20.0;
    else
        return 1.0 - $scorered / 20.0;
    // return $scoreblue / ($scoreblue + $scorered);
}

function setPlayerDefaults(& $p) {
    $p['atk_rating'] = 1500;
    $p['def_rating'] = 1500;
    $p['num_matches'] = 0;
    $p['matches_won'] = 0;
    $p['atk_matches'] = 0;
    $p['def_matches'] = 0;
    $p['last_match_date'] = mktime(0, 0, 0, 1, 1, 2016);
}

function fullAnalysis($allmatches, $playerids, $pdo) {

    $players = array();
    foreach($playerids as $pid) {
        $players[$pid] = array();
        $players[$pid]['player_id'] = $pid;
        setPlayerDefaults($players[$pid]);
    }

    $bluewins = 0;
    $redwins = 0;

    $teams = array('blue', 'red');
    $roles = array('atk', 'def');
    //$allpositions = ["bluedef", "blueatk", "redatk", "reddef"];

    $match_ratings = array();
    foreach($allmatches as $match) {
        $id = $match['id'];
        $rating = & $match_ratings[$id];

        $rating['match_id'] = $id;

        $won['blue'] = 0;
        $won['red'] = 0;
        if ($match['scoreblue'] > $match['scorered'] )
            $won['blue']++;
        if ($match['scoreblue'] < $match['scorered'] )
            $won['red']++;

        foreach($teams as $team) {
            foreach($roles as $role) {
                $player_id = $match[$team . $role];
                $players[$player_id]['num_matches']++;
                $players[$player_id]['matches_won'] += $won[$team];
                $players[$player_id]['last_match_date'] = strtotime($match['time']);
                $players[$player_id][$role . '_matches']++;
                $rating[$team . $role . '_rating'] = $players[$player_id][$role . '_rating'];
            }
        }

        if ($match['scoreblue'] > $match['scorered'])
            $bluewins++;
        elseif ($match['scoreblue'] < $match['scorered'])
            $redwins++;

        $blueElo = 0.565 * $rating['bluedef_rating'] + 0.435 * $rating['blueatk_rating'];
        $redElo  = 0.565 * $rating['reddef_rating']  + 0.435 * $rating['redatk_rating'];

        $blueEloValue  = 1.0 / (1.0 + pow(10, ($redElo - $blueElo) / 400.0));
        $blueRealValue = scoreToValue($match['scoreblue'], $match['scorered']);

        $gainBlue = $blueRealValue - $blueEloValue;
        $gainRed  = - $gainBlue;

        // TODO: Add individual K factors per player?
        $kFactor = 80.0;

        $rating['blueatk_delta'] = $kFactor * $gainBlue;
        $rating['bluedef_delta'] = $kFactor * $gainBlue;
        $rating['redatk_delta']  = $kFactor * $gainRed;
        $rating['reddef_delta']  = $kFactor * $gainRed;

        $players[$match['blueatk']]['atk_rating'] += $kFactor * $gainBlue;
        $players[$match['bluedef']]['def_rating'] += $kFactor * $gainBlue;
        $players[$match['redatk']]['atk_rating']  += $kFactor * $gainRed;
        $players[$match['reddef']]['def_rating']  += $kFactor * $gainRed;
    }

    $affectedrows = $pdo->exec("DELETE FROM match_ratings");
    $stmnt = $pdo->prepare("INSERT INTO 'match_ratings' ('match_id',
        'bluedef_rating','bluedef_delta','blueatk_rating','blueatk_delta',
        'redatk_rating','redatk_delta','reddef_rating','reddef_delta')
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach($match_ratings as $r) {
        $stmnt->execute(array($r['match_id'],
            $r['bluedef_rating'],$r['bluedef_delta'],$r['blueatk_rating'],$r['blueatk_delta'],
            $r['redatk_rating'],$r['redatk_delta'],$r['reddef_rating'],$r['reddef_delta']));
    }

    $affectedrows = $pdo->exec("DELETE FROM player_ratings");

    $stmnt = $pdo->prepare("INSERT INTO 'player_ratings'
        ('player_id','atk_rating','def_rating',
        'num_matches', 'matches_won',
        'atk_matches','def_matches',
        'active')
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    if ($stmnt == false) {
        print_r($pdo->errorInfo());
    } else {
        // date('Y-m-d G:i:s', $p['last_match_date'])
        $tnow = time();
        foreach($players as $p) {
            $active = false;
            if (($tnow - $p['last_match_date']) <= (60+$p['num_matches'])*(24*60*60) )
                $active = true;
            $stmnt->execute(array($p['player_id'], $p['atk_rating'], $p['def_rating'], $p['num_matches'], $p['matches_won'], $p['atk_matches'], $p['def_matches'], $active));
        }
    }

    $pdo->exec("REPLACE INTO statistics (key,value) VALUES ('bluewins',{$bluewins}), ('redwins',{$redwins})");
}


$q = $pdo->query('SELECT id FROM players');
$pids = $q->fetchAll(PDO::FETCH_COLUMN);
$q = $pdo->query('SELECT * FROM matches ORDER BY id ASC');
$allmatches = $q->fetchAll(PDO::FETCH_ASSOC);
fullAnalysis($allmatches, $pids, $pdo);

?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Foosball tournament</title>
  </head>
  <body>
    <h1>Recomputed Elo</h1>
  </body>
</html>

