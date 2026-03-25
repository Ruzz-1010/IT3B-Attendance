<?php
require_once 'config.php';

$studentId = sanitize($_GET['studentId']);
$today = date('Y-m-d');

$sql = "SELECT * FROM attendance 
        WHERE student_id = '$studentId' 
        AND date = '$today' 
        ORDER BY id DESC LIMIT 1";

$result = $conn->query($sql);

$hasTimeIn = false;
$hasTimeOut = false;

if ($row = $result->fetch_assoc()) {
    if ($row['type'] == 'time_in' && $row['time_out'] == NULL) {
        $hasTimeIn = true;
        $hasTimeOut = false;
    } elseif ($row['type'] == 'time_out') {
        $hasTimeIn = true;
        $hasTimeOut = true;
    }
}

jsonResponse(true, 'Attendance status retrieved', [
    'hasTimeIn' => $hasTimeIn,
    'hasTimeOut' => $hasTimeOut
]);
?>