<?php
require_once 'config.php';

// Check if admin is logged in
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    jsonResponse(false, 'Unauthorized');
}

$date = isset($_GET['date']) ? sanitize($_GET['date']) : date('Y-m-d');
$search = isset($_GET['search']) ? sanitize($_GET['search']) : '';

// Build query
$sql = "SELECT * FROM attendance WHERE date = '$date'";
if (!empty($search)) {
    $sql .= " AND (student_id LIKE '%$search%' OR student_name LIKE '%$search%')";
}
$sql .= " ORDER BY time_in DESC";

$result = $conn->query($sql);
$attendance = [];

while ($row = $result->fetch_assoc()) {
    $attendance[] = $row;
}

// Calculate statistics
$stats = [
    'present' => 0,
    'late' => 0,
    'absent' => 0,
    'total' => count($attendance)
];

foreach ($attendance as $record) {
    if ($record['type'] == 'time_in') {
        $timeIn = strtotime($record['time_in']);
        $timeInStart = strtotime($record['time_in_start']); // You might need to join with settings
        if ($timeIn > $timeInStart + 300) { // 5 minutes grace period
            $stats['late']++;
        } else {
            $stats['present']++;
        }
    }
}

jsonResponse(true, 'Attendance retrieved', [
    'attendance' => $attendance,
    'stats' => $stats
]);
?>