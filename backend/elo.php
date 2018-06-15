<?php

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

function fullAnalysis($allmatches, $playernames, $pdo) {
    // $playernames[id] = namestring

    $players = [];
    foreach($playernames as $key => $name) {
        $players[$key] = [];
        $players[$key]['name'] = $name;
        $players[$key]['player_id'] = $key;
        setPlayerDefaults($players[$key]);
    }

    $teams = ['blue', 'red'];
    $roles = ['atk', 'def'];
    //$allpositions = ["bluedef", "blueatk", "redatk", "reddef"];

    $match_ratings = [];
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

    $affectedrows = $pdo->exec("DELETE FROM player_ratings");

    $stmnt = $pdo->prepare("INSERT INTO 'player_ratings'
        ('player_id','atk_rating','def_rating',
        'num_matches', 'matches_won',
        'atk_matches','def_matches',
        'last_match_date')
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    if ($stmnt == false) {
        print_r($pdo->errorInfo());
    } else {
        foreach($players as $p) {
            $stmnt->execute(array($p['player_id'], $p['atk_rating'], $p['def_rating'], $p['num_matches'], $p['matches_won'], $p['atk_matches'], $p['def_matches'], date('Y-m-d G:i:s', $p['last_match_date']) ));
        }
    }
}

//  # Most recent match should be within 2 months + twice the number of matches in days
//  tnow = Time.now
//  classification = classification.select{|playerid,data| (tnow - data[:latest_match_time]) <= (2 * (30 + data[:num_matches]) * (24*60*60)) }
//
//  best_attackers = classification.values.sort do |a, b|
//    comp = b[:attackElo] <=> a[:attackElo]
//    comp.zero? ? (b[:defenseElo] <=> a[:defenseElo]) : comp
//  end
//  best_defenders = classification.values.sort do |a, b|
//    comp = b[:defenseElo] <=> a[:defenseElo]
//    comp.zero? ? (b[:attackElo] <=> a[:attackElo]) : comp
//  end
//  best_attackers.each do |c|
//    c[:attackElo] = c[:attackElo].round
//    c[:defenseElo] = c[:defenseElo].round
//  end
//  best_defenders.each do |c|
//    c[:attackElo] = c[:attackElo].round
//    c[:defenseElo] = c[:defenseElo].round
//  end
//
//  # Sort by points and then by number of matches (reverse)
//  sorted_classification = classification.values.sort do |a, b|
//    comp = b[:points] <=> a[:points]
//    comp.zero? ? (a[:num_matches] <=> b[:num_matches]) : comp
//  end
//
//  pos = 1
//  sorted_classification.each do |c|
//    c[:position] = pos
//    pos += 1
//
//    c[:attackElo] = c[:attackElo].round
//    c[:defenseElo] = c[:defenseElo].round
//  end
//
//  return {:overall => sorted_classification, :bestattackers => best_attackers, :bestdefenders => best_defenders}
//

?>
