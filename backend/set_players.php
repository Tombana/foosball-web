<?php
header("Content-Type: application/json; charset=UTF-8");

$pdo = new PDO("sqlite:foos.db");

$allpositions = ["bluedef", "blueatk", "redatk", "reddef"];

$result = [];
$result['affectedrows'] = 0;

foreach ($allpositions as $position) {
    if (!empty($_REQUEST[$position])) {
        $player_id = $_REQUEST[$position];

        $affectedrows = $pdo->exec("UPDATE playerpositions SET player_id='{$player_id}' WHERE position='{$position}'");

        $result[$position] = $player_id;
        $result['affectedrows'] += $affectedrows;
    }
}

echo json_encode($result);
?>
