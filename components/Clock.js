// Clock and Greeting component for NoBoringTab

class ClockComponent {
    constructor() {
        this.clockElement = null;
        this.greetingElement = null;
        this.userName = 'there';
        this.format24Hour = false;
        this.showSeconds = false;
        this.interval = null;
        
        this.init();
    }

    async init() {
        // Get DOM elements
        this.clockElement = document.getElementById('clock');
        this.greetingElement = document.getElementById('greeting');
        
        // Load settings
        await this.loadSettings();
        
        // Start clock
        this.startClock();
        
        // Update greeting
        this.updateGreeting();
        
        // Update every second
        this.interval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    async loadSettings() {
        try {
            let settings = {};
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get([
                    'userName',
                    'clockFormat24Hour',
                    'clockShowSeconds'
                ]);
                settings = result;
            } else {
                // Fallback to localStorage
                const userName = localStorage.getItem('noboringtab_userName');
                const format24 = localStorage.getItem('noboringtab_clockFormat24Hour');
                const showSeconds = localStorage.getItem('noboringtab_clockShowSeconds');
                
                settings = {
                    userName: userName ? JSON.parse(userName) : 'there',
                    clockFormat24Hour: format24 ? JSON.parse(format24) : false,
                    clockShowSeconds: showSeconds ? JSON.parse(showSeconds) : false
                };
            }
            
            this.userName = settings.userName || 'there';
            this.format24Hour = settings.clockFormat24Hour || false;
            this.showSeconds = settings.clockShowSeconds || false;
            
        } catch (error) {
            console.error('Error loading clock settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                userName: this.userName,
                clockFormat24Hour: this.format24Hour,
                clockShowSeconds: this.showSeconds
            };
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set(settings);
            } else {
                // Fallback to localStorage
                Object.entries(settings).forEach(([key, value]) => {
                    localStorage.setItem(`noboringtab_${key}`, JSON.stringify(value));
                });
            }
        } catch (error) {
            console.error('Error saving clock settings:', error);
        }
    }

    startClock() {
        this.updateTime();
        this.updateGreeting();
    }

    updateTime() {
        if (!this.clockElement) return;
        
        const now = new Date();
        let timeString;
        
        if (this.format24Hour) {
            timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: this.showSeconds ? '2-digit' : undefined
            });
        } else {
            timeString = now.toLocaleTimeString('en-US', {
                hour12: true,
                hour: 'numeric',
                minute: '2-digit',
                second: this.showSeconds ? '2-digit' : undefined
            });
        }
        
        this.clockElement.textContent = timeString;
        
        // Add subtle animation on minute change
        const currentMinute = now.getMinutes();
        if (currentMinute !== this.lastMinute) {
            this.clockElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                this.clockElement.style.transform = 'scale(1)';
            }, 200);
            this.lastMinute = currentMinute;
        }
    }

    updateGreeting() {
        if (!this.greetingElement) return;
        
        const now = new Date();
        const hour = now.getHours();
        let greeting;
        
        // Determine greeting based on time
        if (hour >= 0 && hour < 6) {
            greeting = 'Good night';
        } else if (hour >= 6 && hour < 12) {
            greeting = 'Good morning';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Good afternoon';
        } else if (hour >= 17 && hour < 21) {
            greeting = 'Good evening';
        } else {
            greeting = 'Good night';
        }
        
        // Add special greetings for specific times or days
        const specialGreeting = this.getSpecialGreeting(now);
        if (specialGreeting) {
            greeting = specialGreeting;
        }
        
        // Format greeting with user name
        const fullGreeting = `${greeting}, ${this.userName}!`;
        
        // Update with animation if text changed
        if (this.greetingElement.textContent !== fullGreeting) {
            this.greetingElement.style.opacity = '0';
            setTimeout(() => {
                this.greetingElement.textContent = fullGreeting;
                this.greetingElement.style.opacity = '1';
            }, 150);
        }
    }

    getSpecialGreeting(date) {
        const hour = date.getHours();
        const day = date.getDay(); // 0 = Sunday, 6 = Saturday
        const dayOfMonth = date.getDate();
        const month = date.getMonth(); // 0 = January
        
        // Weekend greetings
        if (day === 0 || day === 6) {
            if (hour >= 8 && hour < 12) {
                return 'Happy weekend';
            }
        }
        
        // Monday motivation
        if (day === 1 && hour >= 6 && hour < 10) {
            return 'Happy Monday';
        }
        
        // Friday celebration
        if (day === 5 && hour >= 15) {
            return 'Happy Friday';
        }
        
        // Holiday greetings
        const holidays = this.getHolidays(date.getFullYear());
        const today = `${month + 1}-${dayOfMonth}`;
        
        if (holidays[today]) {
            return holidays[today];
        }
        
        // Late night/early morning
        if (hour >= 0 && hour < 6) {
            return 'Burning the midnight oil';
        }
        
        // Lunch time
        if (hour >= 12 && hour < 14) {
            return 'Lunch time';
        }
        
        return null;
    }

    getHolidays(year) {
        return {
            '1-1': 'Happy New Year',
            '2-14': 'Happy Valentine\'s Day',
            '3-17': 'Happy St. Patrick\'s Day',
            '10-31': 'Happy Halloween',
            '12-25': 'Merry Christmas',
            '12-31': 'Happy New Year\'s Eve'
        };
    }

    setUserName(name) {
        this.userName = name.trim() || 'there';
        this.updateGreeting();
        this.saveSettings();
    }

    setFormat(format24Hour) {
        this.format24Hour = format24Hour;
        this.updateTime();
        this.saveSettings();
    }

    setShowSeconds(showSeconds) {
        this.showSeconds = showSeconds;
        this.updateTime();
        this.saveSettings();
    }

    // Get current time information
    getTimeInfo() {
        const now = new Date();
        return {
            time: now.toLocaleTimeString(),
            date: now.toLocaleDateString(),
            timestamp: now.getTime(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            hour: now.getHours(),
            minute: now.getMinutes(),
            second: now.getSeconds(),
            day: now.getDay(),
            dayOfMonth: now.getDate(),
            month: now.getMonth(),
            year: now.getFullYear()
        };
    }

    // Format time for different uses
    formatTime(date = new Date(), format = 'default') {
        switch (format) {
            case '24hour':
                return date.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
            
            case '12hour':
                return date.toLocaleTimeString('en-US', {
                    hour12: true,
                    hour: 'numeric',
                    minute: '2-digit'
                });
            
            case 'full':
                return date.toLocaleTimeString('en-US', {
                    hour12: !this.format24Hour,
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit'
                });
            
            case 'short':
                return date.toLocaleTimeString('en-US', {
                    hour12: !this.format24Hour,
                    hour: 'numeric',
                    minute: '2-digit'
                });
            
            default:
                return date.toLocaleTimeString('en-US', {
                    hour12: !this.format24Hour,
                    hour: 'numeric',
                    minute: '2-digit',
                    second: this.showSeconds ? '2-digit' : undefined
                });
        }
    }

    // Create analog clock (optional feature)
    createAnalogClock(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '200');
        svg.setAttribute('viewBox', '0 0 200 200');
        svg.classList.add('analog-clock');
        
        // Clock face
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '100');
        circle.setAttribute('cy', '100');
        circle.setAttribute('r', '95');
        circle.setAttribute('fill', 'rgba(255,255,255,0.1)');
        circle.setAttribute('stroke', 'rgba(255,255,255,0.3)');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);
        
        // Hour markers
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) * Math.PI / 180;
            const x1 = 100 + 80 * Math.sin(angle);
            const y1 = 100 - 80 * Math.cos(angle);
            const x2 = 100 + 70 * Math.sin(angle);
            const y2 = 100 - 70 * Math.cos(angle);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', 'rgba(255,255,255,0.5)');
            line.setAttribute('stroke-width', '2');
            svg.appendChild(line);
        }
        
        // Clock hands
        const hourHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hourHand.setAttribute('x1', '100');
        hourHand.setAttribute('y1', '100');
        hourHand.setAttribute('stroke', 'white');
        hourHand.setAttribute('stroke-width', '4');
        hourHand.setAttribute('stroke-linecap', 'round');
        hourHand.classList.add('hour-hand');
        svg.appendChild(hourHand);
        
        const minuteHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        minuteHand.setAttribute('x1', '100');
        minuteHand.setAttribute('y1', '100');
        minuteHand.setAttribute('stroke', 'white');
        minuteHand.setAttribute('stroke-width', '2');
        minuteHand.setAttribute('stroke-linecap', 'round');
        minuteHand.classList.add('minute-hand');
        svg.appendChild(minuteHand);
        
        const secondHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        secondHand.setAttribute('x1', '100');
        secondHand.setAttribute('y1', '100');
        secondHand.setAttribute('stroke', '#ff4444');
        secondHand.setAttribute('stroke-width', '1');
        secondHand.setAttribute('stroke-linecap', 'round');
        secondHand.classList.add('second-hand');
        svg.appendChild(secondHand);
        
        // Center dot
        const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        centerDot.setAttribute('cx', '100');
        centerDot.setAttribute('cy', '100');
        centerDot.setAttribute('r', '4');
        centerDot.setAttribute('fill', 'white');
        svg.appendChild(centerDot);
        
        container.appendChild(svg);
        
        // Update analog clock
        const updateAnalogClock = () => {
            const now = new Date();
            const hours = now.getHours() % 12;
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            
            const hourAngle = (hours * 30 + minutes * 0.5) * Math.PI / 180;
            const minuteAngle = (minutes * 6) * Math.PI / 180;
            const secondAngle = (seconds * 6) * Math.PI / 180;
            
            // Hour hand
            const hourX = 100 + 50 * Math.sin(hourAngle);
            const hourY = 100 - 50 * Math.cos(hourAngle);
            hourHand.setAttribute('x2', hourX);
            hourHand.setAttribute('y2', hourY);
            
            // Minute hand
            const minuteX = 100 + 70 * Math.sin(minuteAngle);
            const minuteY = 100 - 70 * Math.cos(minuteAngle);
            minuteHand.setAttribute('x2', minuteX);
            minuteHand.setAttribute('y2', minuteY);
            
            // Second hand
            const secondX = 100 + 75 * Math.sin(secondAngle);
            const secondY = 100 - 75 * Math.cos(secondAngle);
            secondHand.setAttribute('x2', secondX);
            secondHand.setAttribute('y2', secondY);
        };
        
        // Update analog clock every second
        setInterval(updateAnalogClock, 1000);
        updateAnalogClock(); // Initial update
    }

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

// Initialize clock when DOM is loaded
let clockComponent;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        clockComponent = new ClockComponent();
    });
} else {
    clockComponent = new ClockComponent();
}

// Export for global access
window.clockComponent = clockComponent;