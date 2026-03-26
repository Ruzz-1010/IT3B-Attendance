<?php

$conn = new mysqli(
    getenv('MYSQLHOST'),
    getenv('MYSQLUSER'),
    getenv('MYSQLPASSWORD'),
    getenv('MYSQLDATABASE'),
    getenv('MYSQLPORT')
);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "Database Connected!";

?>