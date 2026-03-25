<?php
require_once 'config.php';

// Get POST data
$studentId = sanitize($_POST['studentId']);
$studentName = sanitize($_POST['studentName']);
$latitude = floatval($_POST['latitude']);
$longitude = floatval($_POST['longitude']);
$photo = $_POST['photo'];

// Validate required fields
if (empty($studentId) || empty($studentName) || empty($photo)) {
    jsonResponse(false, 'Please fill in all fields and capture a photo');
}

// Get admin settings
$settingsQuery = "SELECT * FROM admin_settings WHERE id = 1";
$settingsResult = $conn->query($settingsQuery);
$settings = $settingsResult->fetch_assoc();

if (!$settings) {
    jsonResponse(false, 'System settings not configured by admin');
}

// Check location
$distance = calculateDistance($latitude, $longitude, $settings['latitude'], $settings['longitude']);
if ($distance > $settings['radius']) {
    jsonResponse(false, 'You are outside the allowed attendance area');
}

// Check time
$currentTime = date('H:i');
$isTimeIn = ($currentTime >= $settings['time_in_start'] && $currentTime <= $settings['time_in_end']);
$isTimeOut = ($currentTime >= $settings['time_out_start'] && $currentTime <= $settings['time_out_end']);

if (!$isTimeIn && !$isTimeOut) {
    jsonResponse(false, 'Attendance window is closed');
}

// Determine if this is time in or time out
$today = date('Y-m-d');
$attendanceType = '';

// Check if student already has time in today
$checkQuery = "SELECT * FROM attendance 
               WHERE student_id = '$studentId' 
               AND date = '$today' 
               ORDER BY id DESC LIMIT 1";
$checkResult = $conn->query($checkQuery);

if ($checkResult->num_rows > 0) {
    $lastRecord = $checkResult->fetch_assoc();
    if ($lastRecord['type'] == 'time_in' && $lastRecord['time_out'] == NULL) {
        // Can only time out if within time out window
        if ($isTimeOut) {
            $attendanceType = 'time_out';
        } else {
            jsonResponse(false, 'You have already timed in. Time out window is not open yet.');
        }
    } else if ($lastRecord['type'] == 'time_out') {
        jsonResponse(false, 'You have already completed attendance for today');
    }
} else {
    // No attendance today, must be time in
    if ($isTimeIn) {
        $attendanceType = 'time_in';
    } else {
        jsonResponse(false, 'Time in window is closed. Please wait for time out window.');
    }
}

// Process photo upload
$photoPath = savePhoto($photo, $studentId);
if (!$photoPath) {
    jsonResponse(false, 'Failed to save photo');
}

// Insert attendance record
if ($attendanceType == 'time_in') {
    $sql = "INSERT INTO attendance (student_id, student_name, date, time_in, latitude, longitude, photo_path) 
            VALUES ('$studentId', '$studentName', '$today', NOW(), '$latitude', '$longitude', '$photoPath')";
} else {
    $sql = "UPDATE attendance 
            SET time_out = NOW(), 
                latitude = '$latitude', 
                longitude = '$longitude',
                photo_path = '$photoPath'
            WHERE student_id = '$studentId' 
            AND date = '$today' 
            AND type = 'time_in'";
}

if ($conn->query($sql)) {
    jsonResponse(true, 'Attendance recorded successfully');
} else {
    jsonResponse(false, 'Error recording attendance: ' . $conn->error);
}

// Helper function to calculate distance
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $R = 6371e3;
    $φ1 = deg2rad($lat1);
    $φ2 = deg2rad($lat2);
    $Δφ = deg2rad($lat2 - $lat1);
    $Δλ = deg2rad($lon2 - $lon1);

    $a = sin($Δφ/2) * sin($Δφ/2) +
         cos($φ1) * cos($φ2) *
         sin($Δλ/2) * sin($Δλ/2);
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));

    return $R * $c;
}

// Helper function to save photo
function savePhoto($base64, $studentId) {
    $uploadDir = '../uploads/attendance_photos/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $filename = $studentId . '_' . date('Ymd_His') . '.jpg';
    $filepath = $uploadDir . $filename;
    
    // Remove base64 header
    $base64 = preg_replace('#^data:image/\w+;base64,#i', '', $base64);
    $imageData = base64_decode($base64);
    
    if (file_put_contents($filepath, $imageData)) {
        return 'uploads/attendance_photos/' . $filename;
    }
    
    return false;
}
?>