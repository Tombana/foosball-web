<?php
date_default_timezone_set('Europe/Amsterdam');
$pdo = new PDO("sqlite:../db/foos.db", NULL, NULL, array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
?>
