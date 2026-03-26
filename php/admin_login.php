<?php
// php/admin_login.php
require_once 'config.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

$username = sanitize($_POST['username']);
$password = $_POST['password'];

// First, create admin user if not exists (for first time setup)
$checkAdmin = "SELECT id FROM admin_users WHERE username = 'admin'";
$result = $conn->query($checkAdmin);

if ($result->num_rows == 0) {
    // Create default admin user (password: admin123)
    $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $insertAdmin = "INSERT INTO admin_users (username, password, full_name, role, is_active) 
                    VALUES ('admin', '$hashedPassword', 'System Administrator', 'super_admin', 1)";
    $conn->query($insertAdmin);
}

// Check credentials
$sql = "SELECT id, username, password, role FROM admin_users 
        WHERE username = '$username' AND is_active = 1";
$result = $conn->query($sql);

if ($row = $result->fetch_assoc()) {
    if (password_verify($password, $row['password'])) {
        // Set session variables
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_id'] = $row['id'];
        $_SESSION['admin_username'] = $row['username'];
        $_SESSION['admin_role'] = $row['role'];
        
        // Update last login
        $updateSql = "UPDATE admin_users SET last_login = NOW() WHERE id = " . $row['id'];
        $conn->query($updateSql);
        
        // Return success
        jsonResponse(true, 'Login successful');
    } else {
        jsonResponse(false, 'Invalid password');
    }
} else {
    jsonResponse(false, 'Invalid username');
}
?>