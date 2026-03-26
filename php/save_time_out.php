<?php
require_once 'config.php';

// Check if admin is logged in
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$timeOutStart = isset($_POST['timeOutStart']) ? sanitize($_POST['timeOutStart']) : null;
$timeOutEnd = isset($_POST['timeOutEnd']) ? sanitize($_POST['timeOutEnd']) : null;

// Validate - Time Out can be optional, but if set, both must be set
if ($timeOutStart && !$timeOutEnd) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Please set both Time Out start and end time, or leave both empty']);
    exit;
}

if ($timeOutEnd && !$timeOutStart) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Please set both Time Out start and end time, or leave both empty']);
    exit;
}

// Build the update query (only update Time Out fields if they are set)
if ($timeOutStart && $timeOutEnd) {
    $sql = "UPDATE admin_settings 
            SET time_out_start = '$timeOutStart', 
                time_out_end = '$timeOutEnd'
            WHERE id = 1";
} else {
    // If Time Out fields are empty, set them to NULL
    $sql = "UPDATE admin_settings 
            SET time_out_start = NULL, 
                time_out_end = NULL
            WHERE id = 1";
}

if ($conn->query($sql)) {
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Time Out settings saved successfully']);
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Error saving Time Out: ' . $conn->error]);
}
?>