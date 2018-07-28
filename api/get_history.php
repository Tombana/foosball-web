<?php
header("Content-Type: application/json; charset=UTF-8");

if (empty($_REQUEST['player_id'])) {
    $result = array("result" => "Invalid player id");
} else {
    $pId = $_REQUEST['player_id'];

    require 'db.php';

    $atkList = array();
    $defList = array();

    $q = $pdo->prepare("SELECT bluedef,blueatk,redatk,reddef,time,
        bluedef_rating,blueatk_rating, redatk_rating,reddef_rating
        FROM matches INNER JOIN match_ratings ON matches.id = match_ratings.match_id
        WHERE bluedef = ? OR blueatk = ? OR redatk = ? OR reddef = ?
        ORDER BY id ASC");
    $q->execute(array($pId, $pId, $pId, $pId));
    while($row = $q->fetch(PDO::FETCH_ASSOC)) {
        $timestring = date('Y/m/d H:i',strtotime($row['time']));

        $eloValue = 0;
        if ($row['bluedef'] == $pId)
            $defList[] = array($timestring, $row['bluedef_rating']);
        elseif ($row['blueatk'] == $pId)
            $atkList[] = array($timestring, $row['blueatk_rating']);
        elseif ($row['redatk'] == $pId)
            $atkList[] = array($timestring, $row['redatk_rating']);
        elseif ($row['reddef'] == $pId)
            $defList[] = array($timestring, $row['reddef_rating']);
    }

    $result = array("atk_history" => $atkList , "def_history" => $defList);
}

echo json_encode($result);
?>
