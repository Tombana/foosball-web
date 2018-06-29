<?php
header("Content-Type: application/json; charset=UTF-8");
require 'db.php';

$allpositions = ["bluedef", "blueatk", "redatk", "reddef"];

$result = [];
$result['affectedrows'] = 0;

foreach ($allpositions as $position) {
    if (!empty($_REQUEST[$position])) {
        $player_id = $_REQUEST[$position];

        $affectedrows = $pdo->exec("REPLACE INTO playerpositions (position, player_id) VALUES ('{$position}','{$player_id}')");

        $result[$position] = $player_id;
        $result['affectedrows'] += $affectedrows;
    }
}

echo json_encode($result);
?>
