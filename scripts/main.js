// Main application script for NoBoringTab

class NoBoringTabApp {
    constructor() {
        this.isInitialized = false;
        this.focusMode = false;
        this.backgroundInterval = null;
        this.settings = {
            userName: 'there',
            backgroundSource: 'unsplash',
            weatherLocation: 'auto',
            githubUsername: '',
            quickAccessLinks: [],
            dailyGoals: [],
            ambientSound: 'none',
            blockedSites: []
        };
        
        // Sound audio elements
        this.ambientAudio = null;
        this.soundsEnabled = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Load settings
            await this.loadSettings();
            
            // Initialize background
            await this.initBackground();
            
            // Initialize quick access
            this.initQuickAccess();
            
            // Initialize daily goals
            this.initDailyGoals();
            
            // Initialize GitHub stats
            this.initGitHubStats();
            
            // Initialize time tracking
            this.initTimeTracking();
            
            // Initialize Today I Learned
            this.initTodayILearned();
            
            // Initialize journaling
            this.initJournaling();
            
            // Initialize ambient sounds
            this.initAmbientSounds();
            
            // Setup settings modal
            this.setupSettingsModal();
            
            // Setup focus mode
            this.setupFocusMode();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Start periodic updates
            this.startPeriodicUpdates();
            
            this.isInitialized = true;
            console.log('NoBoringTab initialized successfully');
            
        } catch (error) {
            console.error('Error initializing NoBoringTab:', error);
        }
    }

    async loadSettings() {
        try {
            let savedSettings = {};
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get([
                    'userName', 'backgroundSource', 'weatherLocation',
                    'githubUsername', 'quickAccessLinks', 'dailyGoals',
                    'ambientSound', 'blockedSites'
                ]);
                savedSettings = result;
            } else {
                // Fallback to localStorage
                Object.keys(this.settings).forEach(key => {
                    const saved = localStorage.getItem(`noboringtab_${key}`);
                    if (saved) {
                        savedSettings[key] = JSON.parse(saved);
                    }
                });
            }
            
            this.settings = { ...this.settings, ...savedSettings };
            
            // Set default quick access if none exist
            if (!this.settings.quickAccessLinks.length) {
                this.settings.quickAccessLinks = [
                    { name: 'Gmail', url: 'https://gmail.com', icon: 'fas fa-envelope' },
                    { name: 'YouTube', url: 'https://youtube.com', icon: 'fab fa-youtube' },
                    { name: 'Reddit', url: 'https://reddit.com', icon: 'fab fa-reddit' },
                    { name: 'Twitter', url: 'https://twitter.com', icon: 'fab fa-twitter' },
                    { name: 'GitHub', url: 'https://github.com', icon: 'fab fa-github' }
                ];
                await this.saveSettings();
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set(this.settings);
            } else {
                // Fallback to localStorage
                Object.entries(this.settings).forEach(([key, value]) => {
                    localStorage.setItem(`noboringtab_${key}`, JSON.stringify(value));
                });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    async initBackground() {
        if (this.settings.backgroundSource === 'unsplash') {
            await this.loadUnsplashBackground();
        } else {
            this.setGradientBackground();
        }
    }

    async loadUnsplashBackground() {
        try {
            // Use Unsplash Source API (no key required)
            const timeOfDay = this.getTimeOfDay();
            const keywords = {
                morning: 'sunrise,nature,landscape',
                afternoon: 'landscape,nature,mountains',
                evening: 'sunset,nature,landscape',
                night: 'night,stars,landscape'
            };
            
            const keyword = keywords[timeOfDay] || 'nature';
            const width = window.innerWidth || 1920;
            const height = window.innerHeight || 1080;
            
            const imageUrl = `https://source.unsplash.com/${width}x${height}/?${keyword}`;
            
            // Preload image
            const img = new Image();
            img.onload = () => {
                document.body.style.backgroundImage = `url('${imageUrl}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundRepeat = 'no-repeat';
            };
            img.onerror = () => {
                console.warn('Failed to load Unsplash background, using gradient');
                this.setGradientBackground();
            };
            img.src = imageUrl;
            
        } catch (error) {
            console.error('Error loading Unsplash background:', error);
            this.setGradientBackground();
        }
    }

    setGradientBackground() {
        const timeOfDay = this.getTimeOfDay();
        const gradients = {
            morning: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            afternoon: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            evening: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            night: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%, #6b8cce 100%)'
        };
        
        document.body.style.background = gradients[timeOfDay] || gradients.morning;
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    initQuickAccess() {
        const container = document.getElementById('quick-access');
        const addButton = document.getElementById('add-quick-access');
        
        if (!container) return;
        
        this.renderQuickAccess();
        
        addButton?.addEventListener('click', () => {
            this.showQuickAccessModal();
        });
    }

    renderQuickAccess() {
        const container = document.getElementById('quick-access');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.settings.quickAccessLinks.forEach((link, index) => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.target = '_blank';
            linkElement.className = 'flex items-center space-x-3 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200 group';
            linkElement.innerHTML = `
                <img src="${this.getFaviconUrl(link.url)}" alt="${link.name}" class="w-5 h-5 rounded">
                <span class="flex-1 text-sm">${link.name}</span>
                <button onclick="event.preventDefault(); app.removeQuickAccess(${index})" 
                        class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 hover:bg-opacity-50 rounded transition-all duration-200">
                    <i class="fas fa-times text-xs"></i>
                </button>
            `;
            container.appendChild(linkElement);
        });
    }

    getFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return 'https://www.google.com/s2/favicons?domain=example.com&sz=32';
        }
    }

    showQuickAccessModal() {
        const modal = document.getElementById('quick-access-modal');
        const nameInput = document.getElementById('link-name');
        const urlInput = document.getElementById('link-url');
        const saveButton = document.getElementById('save-link');
        const cancelButton = document.getElementById('cancel-link');
        
        if (!modal) return;
        
        // Reset form
        nameInput.value = '';
        urlInput.value = '';
        
        // Show modal
        modal.classList.remove('hidden');
        nameInput.focus();
        
        // Handle save
        const handleSave = () => {
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();
            
            if (name && url) {
                this.addQuickAccess(name, url);
                modal.classList.add('hidden');
            }
        };
        
        // Handle cancel
        const handleCancel = () => {
            modal.classList.add('hidden');
        };
        
        saveButton.onclick = handleSave;
        cancelButton.onclick = handleCancel;
        
        // Handle Enter key
        nameInput.onkeypress = urlInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleSave();
        };
        
        // Handle Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }

    addQuickAccess(name, url) {
        // Ensure URL has protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        this.settings.quickAccessLinks.push({
            name,
            url,
            icon: 'fas fa-link'
        });
        
        this.renderQuickAccess();
        this.saveSettings();
        this.showNotification('Quick access link added!', 'success');
    }

    removeQuickAccess(index) {
        this.settings.quickAccessLinks.splice(index, 1);
        this.renderQuickAccess();
        this.saveSettings();
        this.showNotification('Quick access link removed', 'info');
    }

    initDailyGoals() {
        const container = document.getElementById('daily-goals');
        const addButton = document.getElementById('add-goal');
        
        if (!container) return;
        
        this.renderDailyGoals();
        
        addButton?.addEventListener('click', () => {
            this.addDailyGoal();
        });
    }

    renderDailyGoals() {
        const container = document.getElementById('daily-goals');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.settings.dailyGoals.length === 0) {
            container.innerHTML = `
                <div class="text-center text-sm opacity-60 py-4">
                    <i class="fas fa-target text-lg mb-2"></i>
                    <p>No goals set for today</p>
                </div>
            `;
            return;
        }
        
        this.settings.dailyGoals.forEach((goal, index) => {
            const goalElement = document.createElement('div');
            goalElement.className = `flex items-center space-x-3 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200 ${goal.completed ? 'opacity-60' : ''}`;
            goalElement.innerHTML = `
                <input type="checkbox" ${goal.completed ? 'checked' : ''} 
                       onchange="app.toggleGoal(${index})"
                       class="w-4 h-4 text-green-600 bg-white bg-opacity-20 border-white border-opacity-30 rounded focus:ring-green-500">
                <span class="flex-1 text-sm ${goal.completed ? 'line-through' : ''}">${goal.text}</span>
                <button onclick="app.removeGoal(${index})" 
                        class="opacity-0 hover:opacity-100 p-1 hover:bg-red-500 hover:bg-opacity-50 rounded transition-all duration-200">
                    <i class="fas fa-times text-xs"></i>
                </button>
            `;
            container.appendChild(goalElement);
        });
    }

    addDailyGoal() {
        const goalText = prompt('Enter your daily goal:');
        if (goalText && goalText.trim()) {
            this.settings.dailyGoals.push({
                text: goalText.trim(),
                completed: false,
                createdAt: new Date().toISOString()
            });
            
            this.renderDailyGoals();
            this.saveSettings();
            this.showNotification('Daily goal added!', 'success');
        }
    }

    toggleGoal(index) {
        if (this.settings.dailyGoals[index]) {
            this.settings.dailyGoals[index].completed = !this.settings.dailyGoals[index].completed;
            this.renderDailyGoals();
            this.saveSettings();
            
            const message = this.settings.dailyGoals[index].completed ? 
                'Goal completed! 🎉' : 'Goal uncompleted';
            this.showNotification(message, 'success');
        }
    }

    removeGoal(index) {
        if (confirm('Remove this goal?')) {
            this.settings.dailyGoals.splice(index, 1);
            this.renderDailyGoals();
            this.saveSettings();
            this.showNotification('Goal removed', 'info');
        }
    }

    async initGitHubStats() {
        const container = document.getElementById('github-contributions');
        const usernameInput = document.getElementById('github-username');
        
        if (!container || !usernameInput) return;
        
        // Load saved username
        usernameInput.value = this.settings.githubUsername;
        
        // Load stats if username exists
        if (this.settings.githubUsername) {
            await this.loadGitHubStats();
        }
        
        // Handle username input
        usernameInput.addEventListener('blur', () => {
            const username = usernameInput.value.trim();
            if (username !== this.settings.githubUsername) {
                this.settings.githubUsername = username;
                this.saveSettings();
                if (username) {
                    this.loadGitHubStats();
                }
            }
        });
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                usernameInput.blur();
            }
        });
    }

    async loadGitHubStats() {
        const container = document.getElementById('github-contributions');
        if (!container || !this.settings.githubUsername) return;
        
        try {
            container.innerHTML = '<div class="text-sm opacity-70">Loading GitHub stats...</div>';
            
            const response = await fetch(`https://api.github.com/users/${this.settings.githubUsername}`);
            if (!response.ok) {
                throw new Error('User not found');
            }
            
            const userData = await response.json();
            
            // Get recent repositories
            const reposResponse = await fetch(`https://api.github.com/users/${this.settings.githubUsername}/repos?sort=updated&per_page=5`);
            const reposData = await reposResponse.json();
            
            container.innerHTML = `
                <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                        <img src="${userData.avatar_url}" alt="${userData.login}" class="w-8 h-8 rounded-full">
                        <div>
                            <div class="text-sm font-medium">${userData.name || userData.login}</div>
                            <div class="text-xs opacity-70">${userData.public_repos} repos • ${userData.followers} followers</div>
                        </div>
                    </div>
                    <div class="text-xs">
                        <div class="font-medium mb-1">Recent repos:</div>
                        ${reposData.slice(0, 3).map(repo => `
                            <div class="truncate opacity-80">
                                <i class="fas fa-circle text-xs mr-1" style="color: ${this.getLanguageColor(repo.language)}"></i>
                                ${repo.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading GitHub stats:', error);
            container.innerHTML = `<div class="text-sm text-red-400">Error: ${error.message}</div>`;
        }
    }

    getLanguageColor(language) {
        const colors = {
            JavaScript: '#f1e05a',
            TypeScript: '#2b7489',
            Python: '#3572A5',
            Java: '#b07219',
            'C++': '#f34b7d',
            'C#': '#239120',
            PHP: '#4F5D95',
            Ruby: '#701516',
            Go: '#00ADD8',
            Rust: '#dea584'
        };
        return colors[language] || '#586069';
    }

    initTimeTracking() {
        this.updateTimeTracking();
        
        // Update every minute
        setInterval(() => {
            this.updateTimeTracking();
        }, 60000);
    }

    async updateTimeTracking() {
        const container = document.getElementById('time-stats');
        if (!container) return;
        
        try {
            let timeData = {};
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['timeTracking']);
                timeData = result.timeTracking || {};
            } else {
                const saved = localStorage.getItem('noboringtab_timeTracking');
                timeData = saved ? JSON.parse(saved) : {};
            }
            
            const today = new Date().toDateString();
            const todayData = timeData[today] || {};
            
            // Convert to hours and sort by time spent
            const sortedSites = Object.entries(todayData)
                .map(([domain, time]) => ({
                    domain,
                    hours: (time / (1000 * 60 * 60)).toFixed(1)
                }))
                .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours))
                .slice(0, 5);
            
            if (sortedSites.length === 0) {
                container.innerHTML = '<div class="text-sm opacity-60">No data for today</div>';
                return;
            }
            
            container.innerHTML = sortedSites.map(site => `
                <div class="flex justify-between items-center text-sm">
                    <span class="truncate flex-1">${site.domain}</span>
                    <span class="text-xs opacity-70">${site.hours}h</span>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error updating time tracking:', error);
        }
    }

    async initTodayILearned() {
        const container = document.getElementById('til-fact');
        const newButton = document.getElementById('new-fact');
        
        if (!container) return;
        
        await this.loadTILFact();
        
        newButton?.addEventListener('click', () => {
            this.loadTILFact();
        });
    }

    async loadTILFact() {
        const container = document.getElementById('til-fact');
        if (!container) return;
        
        try {
            container.textContent = 'Loading interesting fact...';
            
            // Try Wikipedia API first
            const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
            if (response.ok) {
                const data = await response.json();
                if (data.extract) {
                    container.textContent = data.extract;
                    return;
                }
            }
            
            // Fallback to local facts
            const facts = [
                "Octopuses have three hearts and blue blood.",
                "A group of flamingos is called a 'flamboyance'.",
                "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still edible.",
                "Bananas are berries, but strawberries aren't.",
                "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
                "A day on Venus is longer than its year.",
                "Dolphins have names for each other.",
                "The human brain uses 20% of the body's total energy.",
                "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza.",
                "There are more possible games of chess than there are atoms in the observable universe."
            ];
            
            const randomFact = facts[Math.floor(Math.random() * facts.length)];
            container.textContent = randomFact;
            
        } catch (error) {
            console.error('Error loading TIL fact:', error);
            container.textContent = 'Failed to load fact. Try again later.';
        }
    }

    initJournaling() {
        const promptElement = document.getElementById('journal-prompt');
        const entryElement = document.getElementById('journal-entry');
        const saveButton = document.getElementById('save-journal');
        
        if (!promptElement || !entryElement) return;
        
        this.loadJournalPrompt();
        this.loadJournalEntry();
        
        saveButton?.addEventListener('click', () => {
            this.saveJournalEntry();
        });
        
        // Auto-save on blur
        entryElement.addEventListener('blur', () => {
            this.saveJournalEntry();
        });
    }

    loadJournalPrompt() {
        const prompts = [
            "What are three things you're grateful for today?",
            "What's one challenge you overcame recently?",
            "Describe a moment that made you smile today.",
            "What's something new you learned this week?",
            "How do you want to grow in the next month?",
            "What's your biggest accomplishment this week?",
            "What would you tell your younger self?",
            "What's something you're looking forward to?",
            "Describe your ideal day.",
            "What's a habit you want to develop?"
        ];
        
        const promptElement = document.getElementById('journal-prompt');
        if (promptElement) {
            const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
            promptElement.textContent = randomPrompt;
        }
    }

    async loadJournalEntry() {
        const entryElement = document.getElementById('journal-entry');
        if (!entryElement) return;
        
        try {
            const today = new Date().toDateString();
            let entries = {};
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['journalEntries']);
                entries = result.journalEntries || {};
            } else {
                const saved = localStorage.getItem('noboringtab_journalEntries');
                entries = saved ? JSON.parse(saved) : {};
            }
            
            entryElement.value = entries[today] || '';
            
        } catch (error) {
            console.error('Error loading journal entry:', error);
        }
    }

    async saveJournalEntry() {
        const entryElement = document.getElementById('journal-entry');
        if (!entryElement) return;
        
        try {
            const today = new Date().toDateString();
            const entryText = entryElement.value.trim();
            
            let entries = {};
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['journalEntries']);
                entries = result.journalEntries || {};
            } else {
                const saved = localStorage.getItem('noboringtab_journalEntries');
                entries = saved ? JSON.parse(saved) : {};
            }
            
            if (entryText) {
                entries[today] = entryText;
            } else {
                delete entries[today];
            }
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ journalEntries: entries });
            } else {
                localStorage.setItem('noboringtab_journalEntries', JSON.stringify(entries));
            }
            
            if (entryText) {
                this.showNotification('Journal entry saved!', 'success');
            }
            
        } catch (error) {
            console.error('Error saving journal entry:', error);
        }
    }

    initAmbientSounds() {
        const select = document.getElementById('ambient-sound');
        const toggle = document.getElementById('sound-toggle');
        
        if (!select || !toggle) return;
        
        // Set saved sound
        select.value = this.settings.ambientSound;
        
        // Handle sound selection
        select.addEventListener('change', () => {
            this.settings.ambientSound = select.value;
            this.saveSettings();
            
            if (this.soundsEnabled) {
                this.stopAmbientSound();
                if (select.value !== 'none') {
                    this.playAmbientSound(select.value);
                }
            }
        });
        
        // Handle play/pause toggle
        toggle.addEventListener('click', () => {
            if (this.soundsEnabled) {
                this.stopAmbientSound();
            } else {
                if (this.settings.ambientSound !== 'none') {
                    this.playAmbientSound(this.settings.ambientSound);
                }
            }
        });
    }

    playAmbientSound(soundType) {
        if (this.ambientAudio) {
            this.ambientAudio.pause();
        }
        
        // Using YouTube or Soundcloud embed URLs for ambient sounds
        const soundUrls = {
            rain: 'https://www.youtube.com/embed/mPZkdNFkNps?autoplay=1&loop=1&playlist=mPZkdNFkNps',
            forest: 'https://www.youtube.com/embed/xNN7iTA57jM?autoplay=1&loop=1&playlist=xNN7iTA57jM',
            ocean: 'https://www.youtube.com/embed/V1bFr2SWP1I?autoplay=1&loop=1&playlist=V1bFr2SWP1I',
            cafe: 'https://www.youtube.com/embed/DeumyOzKqgI?autoplay=1&loop=1&playlist=DeumyOzKqgI'
        };
        
        if (soundUrls[soundType]) {
            // Create hidden iframe for ambient sound
            if (!document.getElementById('ambient-sound-player')) {
                const iframe = document.createElement('iframe');
                iframe.id = 'ambient-sound-player';
                iframe.style.display = 'none';
                iframe.allow = 'autoplay';
                document.body.appendChild(iframe);
            }
            
            const iframe = document.getElementById('ambient-sound-player');
            iframe.src = soundUrls[soundType];
            
            this.soundsEnabled = true;
            this.updateSoundToggle();
        }
    }

    stopAmbientSound() {
        const iframe = document.getElementById('ambient-sound-player');
        if (iframe) {
            iframe.src = '';
        }
        
        this.soundsEnabled = false;
        this.updateSoundToggle();
    }

    updateSoundToggle() {
        const toggle = document.getElementById('sound-toggle');
        if (toggle) {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = this.soundsEnabled ? 'fas fa-pause' : 'fas fa-play';
            }
            toggle.classList.toggle('sound-playing', this.soundsEnabled);
        }
    }

    setupSettingsModal() {
        const settingsBtn = document.getElementById('settings-btn');
        const modal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('close-settings');
        const saveBtn = document.getElementById('save-settings');
        
        if (!settingsBtn || !modal) return;
        
        settingsBtn.addEventListener('click', () => {
            this.showSettingsModal();
        });
        
        closeBtn?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        saveBtn?.addEventListener('click', () => {
            this.saveSettingsFromModal();
        });
        
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }

    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const bgSource = document.getElementById('bg-source');
        const userName = document.getElementById('user-name');
        const weatherLocation = document.getElementById('weather-location-input');
        
        if (!modal) return;
        
        // Populate current settings
        if (bgSource) bgSource.value = this.settings.backgroundSource;
        if (userName) userName.value = this.settings.userName;
        if (weatherLocation) weatherLocation.value = this.settings.weatherLocation;
        
        modal.classList.remove('hidden');
        userName?.focus();
    }

    async saveSettingsFromModal() {
        const modal = document.getElementById('settings-modal');
        const bgSource = document.getElementById('bg-source');
        const userName = document.getElementById('user-name');
        const weatherLocation = document.getElementById('weather-location-input');
        
        // Update settings
        if (bgSource) this.settings.backgroundSource = bgSource.value;
        if (userName) this.settings.userName = userName.value.trim() || 'there';
        if (weatherLocation) this.settings.weatherLocation = weatherLocation.value.trim() || 'auto';
        
        // Save settings
        await this.saveSettings();
        
        // Update components
        if (window.clockComponent) {
            window.clockComponent.setUserName(this.settings.userName);
        }
        
        if (window.weatherComponent) {
            window.weatherComponent.setLocation(this.settings.weatherLocation);
        }
        
        // Update background if changed
        await this.initBackground();
        
        modal?.classList.add('hidden');
        this.showNotification('Settings saved!', 'success');
    }

    setupFocusMode() {
        const focusBtn = document.getElementById('focus-mode');
        
        focusBtn?.addEventListener('click', () => {
            this.toggleFocusMode();
        });
    }

    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        
        const sections = document.querySelectorAll('.col-span-3, .col-span-6');
        const focusBtn = document.getElementById('focus-mode');
        
        sections.forEach(section => {
            if (this.focusMode) {
                section.classList.add('focus-mode');
            } else {
                section.classList.remove('focus-mode');
            }
        });
        
        if (focusBtn) {
            const icon = focusBtn.querySelector('i');
            if (icon) {
                icon.className = this.focusMode ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        }
        
        const message = this.focusMode ? 'Focus mode enabled' : 'Focus mode disabled';
        this.showNotification(message, 'info');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case ',':
                        e.preventDefault();
                        this.showSettingsModal();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFocusMode();
                        break;
                    case 'r':
                        e.preventDefault();
                        location.reload();
                        break;
                }
            }
            
            // Alt + shortcuts
            if (e.altKey) {
                switch(e.key) {
                    case 'q':
                        e.preventDefault();
                        if (window.quoteBoxComponent) {
                            window.quoteBoxComponent.loadNewQuote();
                        }
                        break;
                    case 't':
                        e.preventDefault();
                        this.loadTILFact();
                        break;
                    case 'w':
                        e.preventDefault();
                        if (window.weatherComponent) {
                            window.weatherComponent.refreshWeather();
                        }
                        break;
                }
            }
        });
    }

    startPeriodicUpdates() {
        // Update background daily
        this.backgroundInterval = setInterval(() => {
            if (this.settings.backgroundSource === 'unsplash') {
                this.loadUnsplashBackground();
            }
        }, 24 * 60 * 60 * 1000); // 24 hours
        
        // Update time tracking every minute
        setInterval(() => {
            this.updateTimeTracking();
        }, 60000);
    }

    showNotification(message, type = 'info') {
        if (window.Utils && window.Utils.Notification) {
            window.Utils.Notification.show(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Cleanup method
    destroy() {
        if (this.backgroundInterval) {
            clearInterval(this.backgroundInterval);
        }
        
        this.stopAmbientSound();
    }
}

// Initialize the app
const app = new NoBoringTabApp();

// Export for global access
window.app = app;