<?php
header("Content-Type: application/json; charset=UTF-8");
require 'db.php';

if( empty($_REQUEST['name'])) {
    $result = array('result' => "Invalid request!");
} else {
    $name = trim($_REQUEST['name']);

    $stmnt = $pdo->prepare("SELECT * FROM players WHERE lower(name) = ?");
    $stmnt->execute(array(strtolower($name)));
    if ($row = $stmnt->fetch()){
        $result = array('result' => "A player with the name '{$row['name']}' already exists!");
    } else {
        $stmnt = $pdo->prepare("INSERT INTO players (name) VALUES (?)");
        if($stmnt->execute(array($name)) ){
            $pid = $pdo->lastInsertId();

            $stmnt = $pdo->prepare("INSERT INTO 'player_ratings'
                ('player_id','atk_rating','def_rating',
                'num_matches', 'matches_won',
                'atk_matches','def_matches',
                'active')
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            if($stmnt->execute(array($pid,1500.0, 1500.0, 0, 0, 0, 0, false))){
                $result = array('result' => "Player '{$name}' successfully added!");
            } else {
                $result = array('result' => "An error occurred when adding ratings for '{$name}'.");
            }
        } else {
            $result = array('result' => "An error occurred when adding '{$name}'.");
        }
    }
}

echo json_encode($result);
?>
