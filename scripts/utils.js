// Utility functions for NoBoringTab

// API Keys and Configuration
const CONFIG = {
    UNSPLASH_ACCESS_KEY: '2dUeh1AiNFTtUGTx7aRQ0yaCGOJ32QaZmHzhanMGl3w',
    OPENWEATHER_API_KEY: 'fa51e62393794a50dcfbcd927d72b539',
    GITHUB_TOKEN: '', // Optional for higher rate limits
    STORAGE_PREFIX: 'noboringtab_'
};

// Local Storage utilities
class Storage {
    static set(key, value) {
        try {
            localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(CONFIG.STORAGE_PREFIX + key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    static clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CONFIG.STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }
}

// Chrome Extension Storage utilities
class ChromeStorage {
    static async set(key, value) {
        try {
            await chrome.storage.sync.set({ [CONFIG.STORAGE_PREFIX + key]: value });
        } catch (error) {
            console.error('Error saving to Chrome storage:', error);
            // Fallback to localStorage
            Storage.set(key, value);
        }
    }

    static async get(key, defaultValue = null) {
        try {
            const result = await chrome.storage.sync.get([CONFIG.STORAGE_PREFIX + key]);
            return result[CONFIG.STORAGE_PREFIX + key] || defaultValue;
        } catch (error) {
            console.error('Error reading from Chrome storage:', error);
            // Fallback to localStorage
            return Storage.get(key, defaultValue);
        }
    }

    static async remove(key) {
        try {
            await chrome.storage.sync.remove([CONFIG.STORAGE_PREFIX + key]);
        } catch (error) {
            console.error('Error removing from Chrome storage:', error);
        }
    }
}

// Date and Time utilities
class DateTime {
    static formatTime(date = new Date()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    static formatDate(date = new Date()) {
        return date.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static getGreeting(name = 'there') {
        const hour = new Date().getHours();
        let greeting;

        if (hour < 12) {
            greeting = 'Good morning';
        } else if (hour < 17) {
            greeting = 'Good afternoon';
        } else {
            greeting = 'Good evening';
        }

        return `${greeting}, ${name}!`;
    }

    static getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 6) return 'night';
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        if (hour < 21) return 'evening';
        return 'night';
    }
}

// API utilities
class API {
    static async get(url, options = {}) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API GET error:', error);
            throw error;
        }
    }

    static async post(url, data, options = {}) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: JSON.stringify(data),
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API POST error:', error);
            throw error;
        }
    }
}

// DOM utilities
class DOM {
    static $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    static $$(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }

    static create(tag, options = {}) {
        const element = document.createElement(tag);

        if (options.className) {
            element.className = options.className;
        }

        if (options.id) {
            element.id = options.id;
        }

        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }

        if (options.textContent) {
            element.textContent = options.textContent;
        }

        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }

        if (options.style) {
            Object.entries(options.style).forEach(([key, value]) => {
                element.style[key] = value;
            });
        }

        return element;
    }

    static show(element) {
        if (typeof element === 'string') {
            element = DOM.$(element);
        }
        if (element) {
            element.classList.remove('hidden');
        }
    }

    static hide(element) {
        if (typeof element === 'string') {
            element = DOM.$(element);
        }
        if (element) {
            element.classList.add('hidden');
        }
    }

    static toggle(element) {
        if (typeof element === 'string') {
            element = DOM.$(element);
        }
        if (element) {
            element.classList.toggle('hidden');
        }
    }

    static fadeIn(element, duration = 300) {
        if (typeof element === 'string') {
            element = DOM.$(element);
        }
        if (element) {
            element.style.opacity = '0';
            element.classList.remove('hidden');
            element.style.transition = `opacity ${duration}ms`;
            setTimeout(() => {
                element.style.opacity = '1';
            }, 10);
        }
    }

    static fadeOut(element, duration = 300) {
        if (typeof element === 'string') {
            element = DOM.$(element);
        }
        if (element) {
            element.style.transition = `opacity ${duration}ms`;
            element.style.opacity = '0';
            setTimeout(() => {
                element.classList.add('hidden');
            }, duration);
        }
    }
}

// Notification utilities
class Notification {
    static show(message, type = 'info', duration = 3000) {
        const notification = DOM.create('div', {
            className: `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${this.getTypeClasses(type)}`,
            innerHTML: `
                <div class="flex items-center space-x-2">
                    <i class="fas ${this.getTypeIcon(type)}"></i>
                    <span>${message}</span>
                </div>
            `
        });

        document.body.appendChild(notification);
        DOM.fadeIn(notification);

        setTimeout(() => {
            DOM.fadeOut(notification);
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    static getTypeClasses(type) {
        const classes = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-black',
            info: 'bg-blue-500 text-white'
        };
        return classes[type] || classes.info;
    }

    static getTypeIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// Debounce utility
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle utility
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Random utilities
class Random {
    static integer(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static float(min, max) {
        return Math.random() * (max - min) + min;
    }

    static choice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static shuffle(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
}

// URL utilities
class URL {
    static isValid(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    static addProtocol(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
        }
        return url;
    }

    static getFavicon(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch (_) {
            return 'https://www.google.com/s2/favicons?domain=example.com&sz=32';
        }
    }
}

// Animation utilities
class Animation {
    static async fadeIn(element, duration = 300) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease`;
            element.classList.remove('hidden');

            requestAnimationFrame(() => {
                element.style.opacity = '1';
                setTimeout(resolve, duration);
            });
        });
    }

    static async fadeOut(element, duration = 300) {
        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';

            setTimeout(() => {
                element.classList.add('hidden');
                resolve();
            }, duration);
        });
    }

    static async slideUp(element, duration = 300) {
        return new Promise(resolve => {
            element.style.transform = 'translateY(20px)';
            element.style.opacity = '0';
            element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
            element.classList.remove('hidden');

            requestAnimationFrame(() => {
                element.style.transform = 'translateY(0)';
                element.style.opacity = '1';
                setTimeout(resolve, duration);
            });
        });
    }
}

// Export for use in other scripts
window.Utils = {
    CONFIG,
    Storage,
    ChromeStorage,
    DateTime,
    API,
    DOM,
    Notification,
    debounce,
    throttle,
    Random,
    URL,
    Animation
};