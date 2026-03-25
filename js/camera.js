// camera.js - Enhanced camera functionality with better error handling

class CameraHandler {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.captureBtn = document.getElementById('captureBtn');
        this.retakeBtn = document.getElementById('retakeBtn');
        this.photoPreview = document.getElementById('photoPreview');
        this.capturedPhoto = document.getElementById('capturedPhoto');
        this.photoDataInput = document.getElementById('photoData');
        this.cameraContainer = document.getElementById('cameraContainer');
        
        this.stream = null;
        this.currentPhoto = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.initCamera();
    }

    setupEventListeners() {
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.retakeBtn.addEventListener('click', () => this.retakePhoto());
        
        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.stream) {
                this.pauseCamera();
            } else if (!document.hidden && !this.currentPhoto) {
                this.resumeCamera();
            }
        });
    }

    async initCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.cameraContainer.classList.add('active');
                    resolve();
                };
            });
            
        } catch (err) {
            console.error('Camera error:', err);
            this.handleCameraError(err);
        }
    }

    handleCameraError(err) {
        let message = 'Unable to access camera';
        if (err.name === 'NotAllowedError') {
            message = 'Camera permission denied. Please allow camera access.';
        } else if (err.name === 'NotFoundError') {
            message = 'No camera found on this device.';
        } else if (err.name === 'NotReadableError') {
            message = 'Camera is in use by another application.';
        }
        
        if (window.attendanceSystem) {
            window.attendanceSystem.showAlert(message, 'error');
        }
        
        // Show fallback UI
        this.cameraContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--text-muted);">
                <i class="fas fa-camera-slash" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 16px; padding: 10px 20px; border: none; background: var(--primary); color: white; border-radius: 8px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }

    capturePhoto() {
        if (!this.video.videoWidth) {
            if (window.attendanceSystem) {
                window.attendanceSystem.showAlert('Camera not ready', 'error');
            }
            return;
        }

        // Set canvas dimensions to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        const ctx = this.canvas.getContext('2d');
        
        // Flip horizontally for mirror effect (selfie style)
        ctx.translate(this.canvas.width, 0);
        ctx.scale(-1, 1);
        
        ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Compress image
        let quality = 0.8;
        let imageData = this.canvas.toDataURL('image/jpeg', quality);
        
        // Ensure file size is under 400KB
        while (this.getBase64Size(imageData) > 400000 && quality > 0.3) {
            quality -= 0.1;
            imageData = this.canvas.toDataURL('image/jpeg', quality);
        }
        
        this.currentPhoto = imageData;
        this.photoDataInput.value = imageData;
        this.capturedPhoto.src = imageData;
        
        // Update UI
        this.video.style.display = 'none';
        this.captureBtn.style.display = 'none';
        this.photoPreview.classList.add('active');
        
        // Stop camera to save resources
        this.stopCamera();
        
        // Update attendance system
        if (window.attendanceSystem) {
            window.attendanceSystem.currentPhoto = imageData;
            window.attendanceSystem.updateSubmitButton();
            window.attendanceSystem.showAlert('Photo captured successfully', 'success');
        }
    }

    getBase64Size(base64String) {
        const base64Length = base64String.split(',')[1].length;
        return (base64Length * 3) / 4;
    }

    retakePhoto() {
        this.currentPhoto = null;
        this.photoDataInput.value = '';
        
        this.photoPreview.classList.remove('active');
        this.video.style.display = 'block';
        this.captureBtn.style.display = 'flex';
        
        // Restart camera
        this.initCamera();
        
        // Update attendance system
        if (window.attendanceSystem) {
            window.attendanceSystem.currentPhoto = null;
            window.attendanceSystem.updateSubmitButton();
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    pauseCamera() {
        if (this.video.paused) return;
        this.video.pause();
    }

    resumeCamera() {
        if (!this.video.paused) return;
        this.video.play();
    }
}

// Initialize camera when DOM is ready
let cameraHandler;
document.addEventListener('DOMContentLoaded', () => {
    cameraHandler = new CameraHandler();
    window.initCamera = () => cameraHandler.initCamera();
});