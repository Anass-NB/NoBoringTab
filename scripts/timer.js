// Pomodoro Timer functionality for NoBoringTab

class PomodoroTimer {
    constructor() {
        this.state = 'stopped'; // stopped, running, paused
        this.mode = 'work'; // work, break, longBreak
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.totalTime = 25 * 60;
        this.interval = null;
        this.pomodoroCount = 0;
        this.sessionCount = 0;
        
        // Settings
        this.settings = {
            workTime: 25,
            shortBreak: 5,
            longBreak: 15,
            longBreakInterval: 4,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            notifications: true,
            sounds: true
        };

        // DOM elements
        this.display = null;
        this.status = null;
        this.startButton = null;
        this.pauseButton = null;
        this.resetButton = null;
        this.countDisplay = null;

        this.init();
    }

    async init() {
        // Get DOM elements
        this.display = document.getElementById('timer-display');
        this.status = document.getElementById('timer-status');
        this.startButton = document.getElementById('timer-start');
        this.pauseButton = document.getElementById('timer-pause');
        this.resetButton = document.getElementById('timer-reset');
        this.countDisplay = document.getElementById('pomodoro-count');

        // Load saved settings and state
        await this.loadState();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update display
        this.updateDisplay();
        this.updateButtons();
        
        // Check if we should reset for new day
        this.checkDayReset();
    }

    setupEventListeners() {
        this.startButton?.addEventListener('click', () => this.start());
        this.pauseButton?.addEventListener('click', () => this.pause());
        this.resetButton?.addEventListener('click', () => this.reset());

        // Listen for visibility changes to pause timer when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === 'running') {
                this.pause();
                this.showNotification('Timer paused (tab not visible)', 'info');
            }
        });

        // Listen for messages from background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'POMODORO_COMPLETE') {
                    this.complete();
                }
            });
        }
    }

    async loadState() {
        try {
            let savedData = {};
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get([
                    'pomodoroCount', 
                    'pomodoroSettings',
                    'lastActiveDate'
                ]);
                savedData = result;
            } else {
                const settings = localStorage.getItem('noboringtab_pomodoroSettings');
                const count = localStorage.getItem('noboringtab_pomodoroCount');
                const date = localStorage.getItem('noboringtab_lastActiveDate');
                
                savedData = {
                    pomodoroSettings: settings ? JSON.parse(settings) : null,
                    pomodoroCount: count ? parseInt(count) : 0,
                    lastActiveDate: date
                };
            }

            // Load settings
            if (savedData.pomodoroSettings) {
                this.settings = { ...this.settings, ...savedData.pomodoroSettings };
            }

            // Load count
            this.pomodoroCount = savedData.pomodoroCount || 0;

            // Update time based on current settings
            this.totalTime = this.settings.workTime * 60;
            this.timeLeft = this.totalTime;

        } catch (error) {
            console.error('Error loading timer state:', error);
        }
    }

    async saveState() {
        try {
            const data = {
                pomodoroCount: this.pomodoroCount,
                pomodoroSettings: this.settings,
                lastActiveDate: new Date().toDateString()
            };

            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set(data);
            } else {
                Object.entries(data).forEach(([key, value]) => {
                    localStorage.setItem(`noboringtab_${key}`, JSON.stringify(value));
                });
            }
        } catch (error) {
            console.error('Error saving timer state:', error);
        }
    }

    checkDayReset() {
        const today = new Date().toDateString();
        const lastDate = localStorage.getItem('noboringtab_lastActiveDate');
        
        if (lastDate && lastDate !== today) {
            // New day, reset count
            this.pomodoroCount = 0;
            this.saveState();
        }
    }

    start() {
        if (this.state === 'stopped' || this.state === 'paused') {
            this.state = 'running';
            
            // Set up Chrome alarm for accurate timing
            if (typeof chrome !== 'undefined' && chrome.alarms) {
                chrome.alarms.create('pomodoroTimer', {
                    delayInMinutes: this.timeLeft / 60
                });
            }
            
            // Start local interval as backup
            this.interval = setInterval(() => {
                this.tick();
            }, 1000);
            
            this.updateButtons();
            this.showNotification(`${this.mode === 'work' ? 'Work' : 'Break'} session started!`, 'info');
        }
    }

    pause() {
        if (this.state === 'running') {
            this.state = 'paused';
            
            // Clear Chrome alarm
            if (typeof chrome !== 'undefined' && chrome.alarms) {
                chrome.alarms.clear('pomodoroTimer');
            }
            
            // Clear interval
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
            
            this.updateButtons();
            this.showNotification('Timer paused', 'warning');
        }
    }

    reset() {
        this.stop();
        
        // Reset to work mode
        this.mode = 'work';
        this.totalTime = this.settings.workTime * 60;
        this.timeLeft = this.totalTime;
        
        this.updateDisplay();
        this.updateButtons();
        this.showNotification('Timer reset', 'info');
    }

    stop() {
        this.state = 'stopped';
        
        // Clear Chrome alarm
        if (typeof chrome !== 'undefined' && chrome.alarms) {
            chrome.alarms.clear('pomodoroTimer');
        }
        
        // Clear interval
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    tick() {
        if (this.state !== 'running') return;
        
        this.timeLeft--;
        this.updateDisplay();
        
        if (this.timeLeft <= 0) {
            this.complete();
        }
    }

    complete() {
        this.stop();
        
        if (this.mode === 'work') {
            // Work session completed
            this.pomodoroCount++;
            this.sessionCount++;
            
            // Determine next break type
            const isLongBreak = this.sessionCount % this.settings.longBreakInterval === 0;
            this.mode = isLongBreak ? 'longBreak' : 'break';
            this.totalTime = (isLongBreak ? this.settings.longBreak : this.settings.shortBreak) * 60;
            
            this.showNotification(
                `Pomodoro #${this.pomodoroCount} completed! Time for a ${isLongBreak ? 'long' : 'short'} break.`,
                'success'
            );
            
            // Play completion sound
            this.playSound('complete');
            
        } else {
            // Break completed
            this.mode = 'work';
            this.totalTime = this.settings.workTime * 60;
            
            this.showNotification('Break over! Ready for another work session?', 'info');
            this.playSound('break-end');
        }
        
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateButtons();
        this.saveState();
        
        // Auto-start next session if enabled
        if (
            (this.mode === 'work' && this.settings.autoStartPomodoros) ||
            (this.mode !== 'work' && this.settings.autoStartBreaks)
        ) {
            setTimeout(() => this.start(), 1000);
        }
    }

    updateDisplay() {
        if (!this.display) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        this.display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update status
        if (this.status) {
            const statusText = {
                work: 'Work Time',
                break: 'Short Break',
                longBreak: 'Long Break'
            };
            
            const stateText = {
                running: '⏰',
                paused: '⏸️',
                stopped: '⏹️'
            };
            
            this.status.textContent = `${statusText[this.mode]} ${stateText[this.state]}`;
        }
        
        // Update count display
        if (this.countDisplay) {
            this.countDisplay.textContent = this.pomodoroCount.toString();
        }
        
        // Update page title
        if (this.state === 'running') {
            document.title = `(${minutes}:${seconds.toString().padStart(2, '0')}) NoBoringTab`;
        } else {
            document.title = 'NoBoringTab';
        }
        
        // Update progress circle if exists
        this.updateProgressCircle();
    }

    updateProgressCircle() {
        const circle = document.querySelector('.timer-circle');
        if (circle) {
            const progress = (this.totalTime - this.timeLeft) / this.totalTime;
            const circumference = 2 * Math.PI * 45; // Assuming radius of 45
            const offset = circumference - (progress * circumference);
            
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = offset;
        }
    }

    updateButtons() {
        if (!this.startButton || !this.pauseButton || !this.resetButton) return;
        
        // Update button states
        const isRunning = this.state === 'running';
        const isPaused = this.state === 'paused';
        
        this.startButton.disabled = isRunning;
        this.pauseButton.disabled = !isRunning;
        this.resetButton.disabled = false;
        
        // Update button icons
        if (isPaused) {
            this.startButton.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            this.startButton.innerHTML = '<i class="fas fa-play"></i>';
        }
        
        // Update button styles
        this.startButton.className = `px-4 py-2 rounded-lg transition-colors duration-200 ${
            isRunning ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
        }`;
        
        this.pauseButton.className = `px-4 py-2 rounded-lg transition-colors duration-200 ${
            !isRunning ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'
        }`;
    }

    playSound(type) {
        if (!this.settings.sounds) return;
        
        // Create audio context for web audio
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const frequencies = {
                complete: [800, 1000, 1200],
                'break-end': [600, 800]
            };
            
            const freqs = frequencies[type] || [800];
            
            freqs.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                }, index * 200);
            });
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    showNotification(message, type = 'info') {
        if (!this.settings.notifications) return;
        
        if (window.Utils && window.Utils.Notification) {
            window.Utils.Notification.show(message, type);
        }
        
        // Also try browser notification API
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('NoBoringTab Pomodoro', {
                body: message,
                icon: 'assets/icon48.png'
            });
        }
    }

    getStats() {
        return {
            pomodoroCount: this.pomodoroCount,
            sessionCount: this.sessionCount,
            currentMode: this.mode,
            timeLeft: this.timeLeft,
            totalTime: this.totalTime,
            state: this.state,
            settings: this.settings
        };
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Update current session if stopped
        if (this.state === 'stopped') {
            if (this.mode === 'work') {
                this.totalTime = this.settings.workTime * 60;
            } else if (this.mode === 'break') {
                this.totalTime = this.settings.shortBreak * 60;
            } else if (this.mode === 'longBreak') {
                this.totalTime = this.settings.longBreak * 60;
            }
            
            this.timeLeft = this.totalTime;
            this.updateDisplay();
        }
        
        this.saveState();
    }

    // Request notification permission
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }
}

// Initialize timer when DOM is loaded
let pomodoroTimer;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pomodoroTimer = new PomodoroTimer();
    });
} else {
    pomodoroTimer = new PomodoroTimer();
}

// Export for global access
window.pomodoroTimer = pomodoroTimer;