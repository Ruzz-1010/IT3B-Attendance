<?php
require_once 'config.php';

$username = sanitize($_POST['username']);
$password = $_POST['password'];

// Hardcoded admin credentials (you should use hashed passwords in production)
$adminUsername = 'admin';
$adminPasswordHash = password_hash('admin123', PASSWORD_DEFAULT);

if ($username === $adminUsername && password_verify($password, $adminPasswordHash)) {
    $_SESSION['admin_logged_in'] = true;
    jsonResponse(true, 'Login successful');
} else {
    jsonResponse(false, 'Invalid credentials');
}
?>