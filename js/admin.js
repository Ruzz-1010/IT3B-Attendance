let map;
let marker;
let circle;
let currentLocation = null;

// Check if admin is logged in
function checkLogin() {
    const loggedIn = localStorage.getItem('adminLoggedIn');
    if (loggedIn === 'true') {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        loadDashboard();
    }
}

// Admin login
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const response = await fetch('php/admin_login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${username}&password=${password}`
    });
    
    const result = await response.json();
    
    if (result.success) {
        localStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        loadDashboard();
    } else {
        alert(result.message);
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
});

// Load dashboard data
async function loadDashboard() {
    await loadSettings();
    await loadAttendance();
    initMap();
    setupEventListeners();
}

// Load settings
async function loadSettings() {
    try {
        const response = await fetch('php/get_settings.php');
        const data = await response.json();
        
        if (data.success && data.data) {
            // Load location settings
            if (data.data.location.latitude) {
                document.getElementById('latitude').value = data.data.location.latitude;
                document.getElementById('longitude').value = data.data.location.longitude;
                document.getElementById('radius').value = data.data.location.radius;
                
                if (map && data.data.location.latitude && data.data.location.longitude) {
                    updateMapLocation(data.data.location.latitude, data.data.location.longitude);
                }
            }
            
            // Load time settings
            if (data.data.time.timeInStart) {
                document.getElementById('timeInStart').value = data.data.time.timeInStart;
                document.getElementById('timeInEnd').value = data.data.time.timeInEnd;
                document.getElementById('timeOutStart').value = data.data.time.timeOutStart;
                document.getElementById('timeOutEnd').value = data.data.time.timeOutEnd;
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Load attendance records
async function loadAttendance() {
    const date = document.getElementById('filterDate').value || new Date().toISOString().split('T')[0];
    const search = document.getElementById('searchStudent').value;
    
    try {
        const response = await fetch(`php/get_attendance.php?date=${date}&search=${search}`);
        const data = await response.json();
        
        if (data.success) {
            updateStatistics(data.data.stats);
            displayAttendanceTable(data.data.attendance);
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

// Update statistics
function updateStatistics(stats) {
    document.getElementById('presentCount').textContent = stats.present || 0;
    document.getElementById('lateCount').textContent = stats.late || 0;
    document.getElementById('absentCount').textContent = stats.absent || 0;
    document.getElementById('totalToday').textContent = stats.total || 0;
}

// Display attendance table
function displayAttendanceTable(attendance) {
    const tbody = document.getElementById('attendanceTableBody');
    
    if (!attendance || attendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = attendance.map(record => `
        <tr>
            <td>${record.date}</td>
            <td>${record.student_id}</td>
            <td>${record.student_name}</td>
            <td>${record.type === 'time_in' ? 'Time In' : 'Time Out'}</td>
            <td>${record.type === 'time_in' ? record.time_in : record.time_out}</td>
            <td>${record.latitude}, ${record.longitude}</td>
            <td><img src="${record.photo_path}" class="photo-thumb" onclick="viewPhoto('${record.photo_path}')"></td>
        </tr>
    `).join('');
}

// View photo modal
function viewPhoto(photoPath) {
    const modal = document.getElementById('photoModal');
    const modalPhoto = document.getElementById('modalPhoto');
    modalPhoto.src = photoPath;
    modal.style.display = 'block';
    
    document.querySelector('.close').onclick = () => {
        modal.style.display = 'none';
    };
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Initialize map
function initMap() {
    map = L.map('map').setView([14.5995, 120.9842], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    map.on('click', (e) => {
        updateMapLocation(e.latlng.lat, e.latlng.lng);
        document.getElementById('latitude').value = e.latlng.lat;
        document.getElementById('longitude').value = e.latlng.lng;
    });
}

// Update map location
function updateMapLocation(lat, lng) {
    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng]).addTo(map);
    }
    
    const radius = parseInt(document.getElementById('radius').value);
    if (circle) {
        circle.setLatLng([lat, lng]);
        circle.setRadius(radius);
    } else {
        circle = L.circle([lat, lng], {
            radius: radius,
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.2
        }).addTo(map);
    }
    
    map.setView([lat, lng], 15);
}

// Pin current location
document.getElementById('pinCurrentLocation').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            updateMapLocation(lat, lng);
            document.getElementById('latitude').value = lat;
            document.getElementById('longitude').value = lng;
        }, (error) => {
            alert('Unable to get your location');
        });
    } else {
        alert('Geolocation not supported');
    }
});

// Save location settings
document.getElementById('saveLocationBtn').addEventListener('click', async () => {
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const radius = document.getElementById('radius').value;
    
    if (!latitude || !longitude) {
        alert('Please pin a location first');
        return;
    }
    
    const response = await fetch('php/save_location.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    });
    
    const result = await response.json();
    alert(result.message);
    
    if (result.success) {
        updateMapLocation(latitude, longitude);
    }
});

// Save time settings
document.getElementById('saveTimeSettings').addEventListener('click', async () => {
    const timeInStart = document.getElementById('timeInStart').value;
    const timeInEnd = document.getElementById('timeInEnd').value;
    const timeOutStart = document.getElementById('timeOutStart').value;
    const timeOutEnd = document.getElementById('timeOutEnd').value;
    
    const response = await fetch('php/save_time_settings.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `timeInStart=${timeInStart}&timeInEnd=${timeInEnd}&timeOutStart=${timeOutStart}&timeOutEnd=${timeOutEnd}`
    });
    
    const result = await response.json();
    alert(result.message);
});

// Filter and search
document.getElementById('filterDate').addEventListener('change', loadAttendance);
document.getElementById('searchStudent').addEventListener('input', loadAttendance);

// Export report
document.getElementById('exportReport').addEventListener('click', () => {
    const table = document.getElementById('attendanceTable');
    let csv = [];
    
    // Get headers
    const headers = [];
    table.querySelectorAll('th').forEach(th => {
        headers.push(th.textContent);
    });
    csv.push(headers.join(','));
    
    // Get data
    table.querySelectorAll('tbody tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach((td, index) => {
            if (index !== 6) { // Skip photo column
                rowData.push(`"${td.textContent}"`);
            }
        });
        csv.push(rowData.join(','));
    });
    
    // Download CSV
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('radius').addEventListener('change', () => {
        if (circle) {
            const radius = parseInt(document.getElementById('radius').value);
            circle.setRadius(radius);
        }
    });
}

// Check login on page load
checkLogin();