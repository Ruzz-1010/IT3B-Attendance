<?php
require_once 'config.php';

// Check if admin is logged in
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$timeInStart = isset($_POST['timeInStart']) ? sanitize($_POST['timeInStart']) : null;
$timeInEnd = isset($_POST['timeInEnd']) ? sanitize($_POST['timeInEnd']) : null;

// Validate
if (!$timeInStart || !$timeInEnd) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Please set both Time In start and end time']);
    exit;
}

// Update only Time In settings (preserve existing Time Out)
$sql = "UPDATE admin_settings 
        SET time_in_start = '$timeInStart', 
            time_in_end = '$timeInEnd'
        WHERE id = 1";

if ($conn->query($sql)) {
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Time In settings saved successfully']);
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Error saving Time In: ' . $conn->error]);
}
?>