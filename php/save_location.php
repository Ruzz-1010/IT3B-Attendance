<?php
require_once 'config.php';

// Check if admin is logged in
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    jsonResponse(false, 'Unauthorized');
}

$latitude = floatval($_POST['latitude']);
$longitude = floatval($_POST['longitude']);
$radius = intval($_POST['radius']);

// Update settings
$sql = "UPDATE admin_settings 
        SET latitude = '$latitude', 
            longitude = '$longitude', 
            radius = '$radius' 
        WHERE id = 1";

if ($conn->query($sql)) {
    jsonResponse(true, 'Location saved successfully');
} else {
    jsonResponse(false, 'Error saving location: ' . $conn->error);
}
?>