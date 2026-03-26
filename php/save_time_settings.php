<?php
require_once 'config.php';

// Check if admin is logged in
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    jsonResponse(false, 'Unauthorized');
}

$timeInStart = sanitize($_POST['timeInStart']);
$timeInEnd = sanitize($_POST['timeInEnd']);
$timeOutStart = sanitize($_POST['timeOutStart']);
$timeOutEnd = sanitize($_POST['timeOutEnd']);

// Validate
if (!$timeInStart || !$timeInEnd) {
    jsonResponse(false, 'Please set Time In schedule');
}

if (!$timeOutStart || !$timeOutEnd) {
    jsonResponse(false, 'Please set Time Out schedule');
}

// Update settings
$sql = "UPDATE admin_settings 
        SET time_in_start = '$timeInStart', 
            time_in_end = '$timeInEnd', 
            time_out_start = '$timeOutStart', 
            time_out_end = '$timeOutEnd' 
        WHERE id = 1";

if ($conn->query($sql)) {
    jsonResponse(true, 'Time settings saved successfully');
} else {
    jsonResponse(false, 'Error saving time settings: ' . $conn->error);
}
?>