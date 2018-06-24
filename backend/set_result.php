<?php
header("Content-Type: application/json; charset=UTF-8");

// Data should be a collection with:
// "players" => ["name1", ..., "name4"]
// "results" => [5, 3]  (score of name1+name2 , name3+name4)
// "start" => time
// "end" => time
// "replays => [...]

function getPlayerFromName($pdo, $name) {
    $q = $pdo->query("SELECT id FROM players WHERE name='{$name}'");
    // Return the first result
    if($row = $q->fetch(PDO::FETCH_ASSOC)) {
        return $row['id'];
    }

    // Player does not exist; create it
    $pdo->exec("INSERT INTO players ('name') VALUES ('{$name}')");

    // SELECT to get the newly created id
    $q = $pdo->query("SELECT id FROM players WHERE name='{$name}'");
    // Return the first result
    if($row = $q->fetch(PDO::FETCH_ASSOC)) {
        return $row['id'];
    }
    // ERROR
    return 0;
}

function process($data) {
    if ($data == NULL) {
        return ['result' => "Invalid request. JSON format expected."];
    }

    $handle = fopen("results/result_" . date('Y_m_d_H_i_s') . ".json", 'w');
    if ($handle) {
        fwrite($handle, json_encode($data));
        fclose($handle);
    }

    if ( !isset($data['type'])
        || $data['type'] != "quickmatch"
        || count($data['results']) != 2
        || count($data['players']) != 4
        || empty($data['start'])
        || empty($data['end']) ) {
        return ['result' => 'Invalid request. "type" : "quickmatch" expected.'];
    }

    $pdo = new PDO("sqlite:foos.db");

    $dbValues = [
        "bluedef" => getPlayerFromName($data['players'][0]),
        "blueatk" => getPlayerFromName($data['players'][1]),
        "redatk" => getPlayerFromName($data['players'][2]),
        "reddef" => getPlayerFromName($data['players'][3]),
        "scoreblue" => $data['results'][0],
        "scorered" => $data['results'][1],
        "time" => date('Y-m-d G:i:s', $data['start']),
        "duration" => ($data['end'] - $data['start']),
        "season_id" => 1
    ];

    $stmnt = $pdo->prepare("INSERT INTO matches ('bluedef','blueatk','redatk','reddef','scoreblue','scorered','time','duration','season_id') VALUES ()");

    if ($stmnt == false) {
        return ['result' => "PDO ERROR.", 'PDO' => $pdo->errorInfo() ];
    }

    //$stmnt->execute($dbValues);
    // TODO: Get id from inserted thing
    // $pdo->query("SELECT last_insert_rowid()");
    // $pdo->query("SELECT seq FROM sqlite_sequence WHERE name=matches");
    $matchid = 0;

    // TODO: Replays
    if (isset($data['replays']) {
        foreach($data['replays'] as $r) {
            //$r['url']
            //$r['time']
            //match id?
        }
    }

    // TODO: ELO
    return ['result' => "Not implemented yet!"];
}


echo json_encode(process(json_decode(file_get_contents('php://input'),true)));
?>



