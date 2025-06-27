// Weather component for NoBoringTab

class WeatherComponent {
    constructor() {
        this.apiKey = ''; // Users need to add their own OpenWeatherMap API key
        this.location = 'auto';
        this.weatherData = null;
        this.lastUpdate = null;
        this.updateInterval = 10 * 60 * 1000; // 10 minutes
        this.intervalId = null;
        
        // DOM elements
        this.weatherIcon = null;
        this.weatherTemp = null;
        this.weatherLocation = null;
        this.weatherDescription = null;
        this.weatherWidget = null;
        
        this.init();
    }

    async init() {
        // Get DOM elements
        this.weatherIcon = document.getElementById('weather-icon');
        this.weatherTemp = document.getElementById('weather-temp');
        this.weatherLocation = document.getElementById('weather-location');
        this.weatherDescription = document.getElementById('weather-description');
        this.weatherWidget = document.getElementById('weather-widget');
        
        // Load settings
        await this.loadSettings();
        
        // Load weather data
        await this.loadWeather();
        
        // Setup auto-update
        this.setupAutoUpdate();
    }

    async loadSettings() {
        try {
            let settings = {};
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get([
                    'weatherApiKey',
                    'weatherLocation'
                ]);
                settings = result;
            } else {
                // Fallback to localStorage
                const apiKey = localStorage.getItem('noboringtab_weatherApiKey');
                const location = localStorage.getItem('noboringtab_weatherLocation');
                
                settings = {
                    weatherApiKey: apiKey ? JSON.parse(apiKey) : '',
                    weatherLocation: location ? JSON.parse(location) : 'auto'
                };
            }
            
            this.apiKey = settings.weatherApiKey || '';
            this.location = settings.weatherLocation || 'auto';
            
        } catch (error) {
            console.error('Error loading weather settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                weatherApiKey: this.apiKey,
                weatherLocation: this.location
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
            console.error('Error saving weather settings:', error);
        }
    }

    async loadWeather() {
        if (!this.apiKey) {
            this.showWeatherError('API key required. Please add your OpenWeatherMap API key in settings.');
            return;
        }
        
        try {
            // Show loading state
            this.showWeatherLoading();
            
            // Get coordinates
            const coords = await this.getCoordinates();
            if (!coords) {
                throw new Error('Unable to get location coordinates');
            }
            
            // Fetch weather data
            const weatherData = await this.fetchWeatherData(coords.lat, coords.lon);
            
            // Update display
            this.weatherData = weatherData;
            this.lastUpdate = Date.now();
            this.updateWeatherDisplay();
            
            // Save to cache
            this.cacheWeatherData();
            
        } catch (error) {
            console.error('Error loading weather:', error);
            this.showWeatherError(error.message);
            
            // Try to load from cache
            this.loadFromCache();
        }
    }

    async getCoordinates() {
        if (this.location === 'auto') {
            // Use geolocation
            return new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error('Geolocation not supported'));
                    return;
                }
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        });
                    },
                    (error) => {
                        reject(new Error(`Geolocation error: ${error.message}`));
                    },
                    {
                        timeout: 10000,
                        enableHighAccuracy: false
                    }
                );
            });
        } else {
            // Use geocoding for city name
            const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(this.location)}&limit=1&appid=${this.apiKey}`;
            
            const response = await fetch(geocodeUrl);
            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.length) {
                throw new Error(`Location "${this.location}" not found`);
            }
            
            return {
                lat: data[0].lat,
                lon: data[0].lon
            };
        }
    }

    async fetchWeatherData(lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        return await response.json();
    }

    updateWeatherDisplay() {
        if (!this.weatherData) return;
        
        const { main, weather, name, sys } = this.weatherData;
        
        // Update temperature
        if (this.weatherTemp) {
            this.weatherTemp.textContent = `${Math.round(main.temp)}°C`;
        }
        
        // Update location
        if (this.weatherLocation) {
            this.weatherLocation.textContent = `${name}, ${sys.country}`;
        }
        
        // Update description
        if (this.weatherDescription) {
            this.weatherDescription.textContent = weather[0].description;
        }
        
        // Update icon
        if (this.weatherIcon) {
            const iconCode = weather[0].icon;
            const emoji = this.getWeatherEmoji(weather[0].main, iconCode);
            this.weatherIcon.textContent = emoji;
        }
        
        // Update widget styling based on weather
        this.updateWeatherStyling(weather[0].main);
        
        // Add detailed info on hover
        this.addWeatherTooltip();
    }

    getWeatherEmoji(main, iconCode) {
        const emojiMap = {
            'Clear': iconCode.includes('d') ? '☀️' : '🌙',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Haze': '🌫️',
            'Dust': '🌪️',
            'Sand': '🌪️',
            'Ash': '🌋',
            'Squall': '💨',
            'Tornado': '🌪️'
        };
        
        return emojiMap[main] || '🌤️';
    }

    updateWeatherStyling(weatherMain) {
        if (!this.weatherWidget) return;
        
        // Remove existing weather classes
        this.weatherWidget.classList.remove(
            'weather-clear', 'weather-clouds', 'weather-rain', 
            'weather-snow', 'weather-storm'
        );
        
        // Add appropriate class
        const classMap = {
            'Clear': 'weather-clear',
            'Clouds': 'weather-clouds',
            'Rain': 'weather-rain',
            'Drizzle': 'weather-rain',
            'Thunderstorm': 'weather-storm',
            'Snow': 'weather-snow',
            'Mist': 'weather-clouds',
            'Fog': 'weather-clouds'
        };
        
        const weatherClass = classMap[weatherMain] || 'weather-clear';
        this.weatherWidget.classList.add(weatherClass);
    }

    addWeatherTooltip() {
        if (!this.weatherWidget || !this.weatherData) return;
        
        const { main, wind, visibility, sys } = this.weatherData;
        
        const tooltip = `
            Feels like: ${Math.round(main.feels_like)}°C
            Humidity: ${main.humidity}%
            Pressure: ${main.pressure} hPa
            Wind: ${wind.speed} m/s
            Visibility: ${visibility ? (visibility / 1000).toFixed(1) + ' km' : 'N/A'}
            Sunrise: ${new Date(sys.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            Sunset: ${new Date(sys.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
        `;
        
        this.weatherWidget.title = tooltip;
    }

    showWeatherLoading() {
        if (this.weatherTemp) this.weatherTemp.textContent = '--°';
        if (this.weatherLocation) this.weatherLocation.textContent = 'Loading...';
        if (this.weatherDescription) this.weatherDescription.textContent = '--';
        if (this.weatherIcon) this.weatherIcon.textContent = '⏳';
    }

    showWeatherError(message) {
        if (this.weatherTemp) this.weatherTemp.textContent = '--°';
        if (this.weatherLocation) this.weatherLocation.textContent = 'Error';
        if (this.weatherDescription) this.weatherDescription.textContent = message;
        if (this.weatherIcon) this.weatherIcon.textContent = '❌';
        
        console.error('Weather error:', message);
    }

    async cacheWeatherData() {
        if (!this.weatherData) return;
        
        const cacheData = {
            weatherData: this.weatherData,
            timestamp: this.lastUpdate
        };
        
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ weatherCache: cacheData });
            } else {
                localStorage.setItem('noboringtab_weatherCache', JSON.stringify(cacheData));
            }
        } catch (error) {
            console.error('Error caching weather data:', error);
        }
    }

    async loadFromCache() {
        try {
            let cacheData = null;
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['weatherCache']);
                cacheData = result.weatherCache;
            } else {
                const cached = localStorage.getItem('noboringtab_weatherCache');
                cacheData = cached ? JSON.parse(cached) : null;
            }
            
            if (cacheData && cacheData.weatherData) {
                const cacheAge = Date.now() - cacheData.timestamp;
                const maxAge = 30 * 60 * 1000; // 30 minutes
                
                if (cacheAge < maxAge) {
                    this.weatherData = cacheData.weatherData;
                    this.lastUpdate = cacheData.timestamp;
                    this.updateWeatherDisplay();
                    
                    // Add cache indicator
                    if (this.weatherDescription) {
                        this.weatherDescription.textContent += ' (cached)';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading cached weather:', error);
        }
    }

    setupAutoUpdate() {
        // Clear existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Setup new interval
        this.intervalId = setInterval(() => {
            this.loadWeather();
        }, this.updateInterval);
    }

    async refreshWeather() {
        await this.loadWeather();
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey.trim();
        this.saveSettings();
        if (this.apiKey) {
            this.loadWeather();
        }
    }

    setLocation(location) {
        this.location = location.trim() || 'auto';
        this.saveSettings();
        this.loadWeather();
    }

    getWeatherData() {
        return {
            data: this.weatherData,
            lastUpdate: this.lastUpdate,
            location: this.location,
            hasApiKey: !!this.apiKey
        };
    }

    // Extended forecast (requires additional API call)
    async getExtendedForecast() {
        if (!this.apiKey || !this.weatherData) return null;
        
        try {
            const coords = await this.getCoordinates();
            const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${this.apiKey}&units=metric`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Forecast API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching extended forecast:', error);
            return null;
        }
    }

    // Weather alerts
    async getWeatherAlerts() {
        if (!this.apiKey || !this.weatherData) return null;
        
        try {
            const coords = await this.getCoordinates();
            const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${coords.lat}&lon=${coords.lon}&appid=${this.apiKey}&exclude=minutely,hourly,daily`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Alerts API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.alerts || [];
        } catch (error) {
            console.error('Error fetching weather alerts:', error);
            return null;
        }
    }

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}

// Initialize weather component when DOM is loaded
let weatherComponent;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        weatherComponent = new WeatherComponent();
    });
} else {
    weatherComponent = new WeatherComponent();
}

// Export for global access
window.weatherComponent = weatherComponent;