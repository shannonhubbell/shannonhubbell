<?php

$name = $_POST['accountname'];
$month = $_POST['month'];
$rating = $_POST['rating'];

$rank_file = fopen('ratings.csv', 'a');

fputcsv($rank_file, array($name,$month,$rating));

fclose($rank_file);