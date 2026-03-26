<?php
// create_admin.php - Run this file once to create admin account
require_once 'php/config.php';

// Admin credentials
$username = 'admin';
$password = 'admin123';
$full_name = 'System Administrator';
$role = 'super_admin';

// Hash the password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Check if admin already exists
$check_sql = "SELECT id FROM admin_users WHERE username = '$username'";
$check_result = $conn->query($check_sql);

if ($check_result->num_rows > 0) {
    // Update existing admin
    $sql = "UPDATE admin_users SET 
            password = '$hashed_password',
            full_name = '$full_name',
            role = '$role',
            is_active = 1
            WHERE username = '$username'";
    
    if ($conn->query($sql)) {
        echo "<h2 style='color: green;'>✓ Admin account UPDATED successfully!</h2>";
    } else {
        echo "<h2 style='color: red;'>Error updating admin: " . $conn->error . "</h2>";
    }
} else {
    // Create new admin
    $sql = "INSERT INTO admin_users (username, password, full_name, role, is_active) 
            VALUES ('$username', '$hashed_password', '$full_name', '$role', 1)";
    
    if ($conn->query($sql)) {
        echo "<h2 style='color: green;'>✓ Admin account CREATED successfully!</h2>";
    } else {
        echo "<h2 style='color: red;'>Error creating admin: " . $conn->error . "</h2>";
    }
}

// Display credentials
echo "
<div style='font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
    <h2 style='color: #667eea;'>Admin Account Details</h2>
    <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
        <tr style='background: #f5f5f5;'>
            <th style='padding: 10px; text-align: left;'>Field</th>
            <th style='padding: 10px; text-align: left;'>Value</th>
        </tr>
        <tr>
            <td style='padding: 10px; border-bottom: 1px solid #ddd;'><strong>Username:</strong></td>
            <td style='padding: 10px; border-bottom: 1px solid #ddd;'><code style='background: #f5f5f5; padding: 5px;'>$username</code></td>
        </tr>
        <tr>
            <td style='padding: 10px; border-bottom: 1px solid #ddd;'><strong>Password:</strong></td>
            <td style='padding: 10px; border-bottom: 1px solid #ddd;'><code style='background: #f5f5f5; padding: 5px;'>$password</code></td>
        </tr>
        <tr>
            <td style='padding: 10px;'><strong>Role:</strong></td>
            <td style='padding: 10px;'>$role</td>
        </tr>
    </table>
    
    <a href='index.html' style='display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;'>Go to Login</a>
    <a href='admin.html' style='display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Go to Admin Panel</a>
</div>
";
?>