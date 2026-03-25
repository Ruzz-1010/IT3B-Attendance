// student.js - Enhanced with better error handling and UX

class AttendanceSystem {
    constructor() {
        this.currentLocation = null;
        this.isWithinLocation = false;
        this.isWithinTime = false;
        this.currentPhoto = null;
        this.settings = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.elements = {
            form: document.getElementById('attendanceForm'),
            submitBtn: document.getElementById('submitBtn'),
            studentId: document.getElementById('studentId'),
            studentName: document.getElementById('studentName'),
            locationStatus: document.querySelector('#locationStatus'),
            timeStatus: document.querySelector('#timeStatus'),
            statusAlert: document.getElementById('statusAlert'),
            alertMessage: document.getElementById('alertMessage'),
            csrfToken: document.getElementById('csrf_token')
        };

        this.init();
    }

    init() {
        this.loadCSRFToken();
        this.checkLocation();
        this.setupEventListeners();
        this.startPeriodicChecks();
    }

    async loadCSRFToken() {
        try {
            const response = await fetch('php/get_csrf.php');
            const data = await response.json();
            if (data.success) {
                this.elements.csrfToken.value = data.token;
            }
        } catch (error) {
            console.error('Failed to load CSRF token:', error);
        }
    }

    setupEventListeners() {
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Validate inputs in real-time
        this.elements.studentId.addEventListener('blur', () => this.validateStudentId());
        this.elements.studentName.addEventListener('blur', () => this.validateStudentName());
    }

    startPeriodicChecks() {
        // Check time every minute
        setInterval(() => {
            if (this.settings) {
                this.checkTimeStatus(this.settings.time);
                this.updateSubmitButton();
            }
        }, 60000);

        // Re-check location every 5 minutes
        setInterval(() => {
            this.checkLocation();
        }, 300000);
    }

    async checkLocation() {
        this.updateLocationUI('checking', 'Checking location...');

        if (!navigator.geolocation) {
            this.updateLocationUI('invalid', 'Geolocation not supported');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                this.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                try {
                    await this.validateLocation();
                } catch (error) {
                    console.error('Location validation error:', error);
                    this.updateLocationUI('invalid', 'Validation error');
                }
            },
            (error) => {
                this.handleLocationError(error);
            },
            options
        );
    }

    async validateLocation() {
        try {
            const response = await fetch('php/get_settings.php');
            const data = await response.json();

            if (!data.success || !data.data) {
                throw new Error('Failed to load settings');
            }

            this.settings = data.data;

            if (data.data.location && data.data.location.latitude) {
                const distance = this.calculateDistance(
                    this.currentLocation.lat,
                    this.currentLocation.lng,
                    data.data.location.latitude,
                    data.data.location.longitude
                );

                this.isWithinLocation = distance <= data.data.location.radius;
                
                if (this.isWithinLocation) {
                    this.updateLocationUI('valid', `✓ Within range (${Math.round(distance)}m)`);
                } else {
                    this.updateLocationUI('invalid', `✗ ${Math.round(distance)}m away (Max: ${data.data.location.radius}m)`);
                }

                // Update hidden inputs
                document.getElementById('latitude').value = this.currentLocation.lat;
                document.getElementById('longitude').value = this.currentLocation.lng;
            } else {
                this.updateLocationUI('invalid', 'Location not configured');
            }

            this.checkTimeStatus(data.data.time);
            this.updateSubmitButton();

        } catch (error) {
            console.error('Error:', error);
            this.updateLocationUI('invalid', 'Connection error');
            this.showAlert('Failed to verify location. Retrying...', 'error');
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.checkLocation(), 2000);
            }
        }
    }

    handleLocationError(error) {
        let message = 'Location error';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location unavailable';
                break;
            case error.TIMEOUT:
                message = 'Location timeout';
                break;
        }
        this.updateLocationUI('invalid', message);
        this.showAlert('Please enable location services', 'error');
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    checkTimeStatus(timeSettings) {
        if (!timeSettings || !timeSettings.timeInStart) {
            this.updateTimeUI('invalid', 'Not configured');
            this.isWithinTime = false;
            return;
        }

        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        
        const isTimeIn = currentTime >= timeSettings.timeInStart && currentTime <= timeSettings.timeInEnd;
        const isTimeOut = currentTime >= timeSettings.timeOutStart && currentTime <= timeSettings.timeOutEnd;

        if (isTimeIn) {
            this.updateTimeUI('valid', 'Time In Open');
            this.isWithinTime = true;
        } else if (isTimeOut) {
            this.updateTimeUI('valid', 'Time Out Open');
            this.isWithinTime = true;
        } else {
            this.updateTimeUI('invalid', 'Closed');
            this.isWithinTime = false;
        }
    }

    updateLocationUI(status, message) {
        const item = this.elements.locationStatus;
        item.className = 'info-item ' + status;
        item.querySelector('.info-value').textContent = message;
    }

    updateTimeUI(status, message) {
        const item = this.elements.timeStatus;
        item.className = 'info-item ' + status;
        item.querySelector('.info-value').textContent = message;
    }

    updateSubmitButton() {
        const canSubmit = this.isWithinLocation && this.isWithinTime && this.currentPhoto;
        const btn = this.elements.submitBtn;
        
        btn.disabled = !canSubmit;
        
        if (!canSubmit) {
            let reason = '';
            if (!this.isWithinLocation) reason = 'Location not verified';
            else if (!this.isWithinTime) reason = 'Time window closed';
            else if (!this.currentPhoto) reason = 'Photo required';
            
            btn.title = reason;
        } else {
            btn.title = 'Ready to submit';
        }
    }

    validateStudentId() {
        const value = this.elements.studentId.value.trim();
        if (value.length < 3) {
            this.showAlert('Student ID must be at least 3 characters', 'error');
            return false;
        }
        return true;
    }

    validateStudentName() {
        const value = this.elements.studentName.value.trim();
        if (value.length < 2) {
            this.showAlert('Please enter your full name', 'error');
            return false;
        }
        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateStudentId() || !this.validateStudentName()) {
            return;
        }

        if (!this.currentPhoto) {
            this.showAlert('Please capture a photo', 'error');
            return;
        }

        const btn = this.elements.submitBtn;
        btn.classList.add('loading');
        btn.disabled = true;

        const formData = new FormData();
        formData.append('studentId', this.elements.studentId.value.trim());
        formData.append('studentName', this.elements.studentName.value.trim());
        formData.append('latitude', this.currentLocation.lat);
        formData.append('longitude', this.currentLocation.lng);
        formData.append('photo', this.currentPhoto);
        formData.append('csrf_token', this.elements.csrfToken.value);

        try {
            const response = await fetch('php/submit_attendance.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(result.message, 'success');
                this.resetForm();
            } else {
                this.showAlert(result.message, 'error');
                if (result.message.includes('CSRF')) {
                    this.loadCSRFToken(); // Refresh token if invalid
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.showAlert('Network error. Please try again.', 'error');
        } finally {
            btn.classList.remove('loading');
            this.updateSubmitButton();
        }
    }

    resetForm() {
        this.elements.form.reset();
        this.currentPhoto = null;
        document.getElementById('photoPreview').classList.remove('active');
        document.getElementById('cameraContainer').style.display = 'block';
        document.getElementById('video').style.display = 'block';
        
        // Reset camera
        if (typeof initCamera === 'function') {
            initCamera();
        }
        
        this.updateSubmitButton();
        
        // Check existing attendance after short delay
        setTimeout(() => this.checkExistingAttendance(), 1000);
    }

    showAlert(message, type = 'info') {
        const alert = this.elements.statusAlert;
        const msg = this.elements.alertMessage;
        
        alert.className = 'status-alert ' + type;
        msg.textContent = message;
        
        // Update icon based on type
        const icon = alert.querySelector('i');
        icon.className = 'fas ' + (type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
        
        alert.classList.add('show');
        
        setTimeout(() => {
            alert.classList.remove('show');
        }, 4000);
    }

    async checkExistingAttendance() {
        const studentId = this.elements.studentId.value.trim();
        if (!studentId) return;

        try {
            const response = await fetch(`php/check_attendance.php?studentId=${encodeURIComponent(studentId)}`);
            const data = await response.json();
            
            if (data.hasTimeIn && !data.hasTimeOut) {
                this.showAlert('You have already timed in. You can now time out.', 'info');
            } else if (data.hasTimeIn && data.hasTimeOut) {
                this.showAlert('Attendance already completed for today', 'success');
                this.elements.submitBtn.disabled = true;
            }
        } catch (error) {
            console.error('Check attendance error:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.attendanceSystem = new AttendanceSystem();
});