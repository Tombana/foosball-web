<?php
header("Content-Type: application/json; charset=UTF-8");
require 'db.php';

$allpositions = array("bluedef", "blueatk", "redatk", "reddef");

$result = array();
$result['affectedrows'] = 0;

foreach ($allpositions as $position) {
    if (!empty($_REQUEST[$position])) {
        $player_id = $_REQUEST[$position];

        $q = $pdo->prepare("REPLACE INTO playerpositions (position, player_id) VALUES (?,?)");
        if ($q->execute(array($position,$player_id)) ) {
            $result[$position] = $player_id;
            $result['affectedrows'] += $q->rowCount();
        }
    }
}

echo json_encode($result);
?>
