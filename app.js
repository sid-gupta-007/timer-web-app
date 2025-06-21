let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let audioContext = null;
let alarmInterval = null;
let isAlarmActive = false;
function initAudio() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio not supported: ', error);
            return false;
        }
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return true;
}
function playBeep() {
    if (!audioContext) return false;
    
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Alarm sound settings
        oscillator.frequency.value = 1000; // 1kHz tone
        oscillator.type = 'sine';
        
        // Volume envelope
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.setValueAtTime(0.3, now + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
        
        oscillator.start(now);
        oscillator.stop(now + 0.25);
        
        return true;
    } catch (error) {
        console.warn('Beep playback failed:', error);
        return false;
    }
}
// Start continuous alarm
function startAlarm() {
    if (isAlarmActive) return;
    
    if (!initAudio()) {
        console.warn('Audio initialization failed');
    }
    
    isAlarmActive = true;
    console.log('Starting continuous alarm...');
    
    // Show alarm notification
    showAlarmNotification();
    
    // Play first beep immediately
    playBeep();
    
    // Then repeat every 500ms
    alarmInterval = setInterval(() => {
        if (isAlarmActive) {
            playBeep();
        } else {
            clearInterval(alarmInterval);
        }
    }, 500);
}
// Stop the alarm
function stopAlarm() {
    console.log('Stopping alarm...');
    isAlarmActive = false;
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
    hideAlarmNotification();
}
// Show alarm notification
function showAlarmNotification() {
    const notification = document.createElement('div');
    notification.className = 'alarm-notification';
    notification.id = 'alarmNotification';
    notification.innerHTML = `⏰ Timer Finished!
        <button class="btn stop-alarm-btn" onclick="stopAlarm()">Stop Alarm</button>`;
    document.body.appendChild(notification);
}
// Hide alarm notification
function hideAlarmNotification() {
    const notification = document.getElementById('alarmNotification');
    if (notification) {
        notification.remove();
    }
}
// Timer functions
function updateTimerDisplay() {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const seconds = timerSeconds % 60;
    
    let display = '';
    if (hours > 0) {
        display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    document.getElementById('timerDisplay').textContent = display;
}
function startTimer() {
    if (!isTimerRunning) {
        // Initialize audio context on user interaction
        initAudio();
        
        // Set timer from inputs if not already running
        if (timerSeconds === 0) {
            const hours = parseInt(document.getElementById('hours').value) || 0;
            const minutes = parseInt(document.getElementById('minutes').value) || 0;
            const seconds = parseInt(document.getElementById('seconds').value) || 0;
            
            timerSeconds = (hours * 3600) + (minutes * 60) + seconds;
            
            if (timerSeconds === 0) {
                alert('Please set a time greater than 0');
                return;
            }
        }
        
        isTimerRunning = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                document.getElementById('startBtn').disabled = false;
                document.getElementById('pauseBtn').disabled = true;
                document.querySelector('.tFrame').classList.add('timer-finished');
                
                // Start the continuous alarm
                startAlarm();
                
                // Show browser notification if supported
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Timer Finished!', {
                        body: 'Your countdown timer has reached zero.',
                        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>'
                    });
                }
            }
        }, 1000);
    }
}
function pauseTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
}
function resetTimer() {
    clearInterval(timerInterval);
    stopAlarm(); // Stop any ongoing alarm
    isTimerRunning = false;
    timerSeconds = 0;
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    
    // Reset inputs to default
    document.getElementById('hours').value = 0;
    document.getElementById('minutes').value = 0;
    document.getElementById('seconds').value = 10;
    
    // Remove visual effects
    document.querySelector('.tFrame').classList.remove('timer-finished');
    
    updateTimerDisplay();
}
// Initialize the app
function init() {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Initialize timer display
    updateTimerDisplay();
}
// Start the app when page loads
window.addEventListener('load', init);