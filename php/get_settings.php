<?php
require_once 'config.php';

// Get admin settings
$query = "SELECT * FROM admin_settings WHERE id = 1";
$result = $conn->query($query);
$settings = $result->fetch_assoc();

if ($settings) {
    jsonResponse(true, 'Settings retrieved', [
        'location' => [
            'latitude' => $settings['latitude'],
            'longitude' => $settings['longitude'],
            'radius' => $settings['radius']
        ],
        'time' => [
            'timeInStart' => $settings['time_in_start'],
            'timeInEnd' => $settings['time_in_end'],
            'timeOutStart' => $settings['time_out_start'],
            'timeOutEnd' => $settings['time_out_end']
        ]
    ]);
} else {
    jsonResponse(false, 'No settings found');
}
?>