// Background service worker for NoBoringTab

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
    console.log('NoBoringTab extension installed');
    
    // Set default values
    const defaults = {
        userName: 'there',
        weatherLocation: 'auto',
        backgroundSource: 'unsplash',
        pomodoroCount: 0,
        dailyGoals: [],
        quickAccessLinks: [
            { name: 'Gmail', url: 'https://gmail.com', icon: 'fas fa-envelope' },
            { name: 'YouTube', url: 'https://youtube.com', icon: 'fab fa-youtube' },
            { name: 'Reddit', url: 'https://reddit.com', icon: 'fab fa-reddit' },
            { name: 'Twitter', url: 'https://twitter.com', icon: 'fab fa-twitter' },
            { name: 'GitHub', url: 'https://github.com', icon: 'fab fa-github' }
        ],
        todoList: [],
        journalEntries: {},
        timeTracking: {},
        lastActiveDate: new Date().toDateString(),
        focusMode: false,
        ambientSound: 'none',
        githubUsername: ''
    };

    // Set defaults only if not already set
    Object.entries(defaults).forEach(([key, value]) => {
        chrome.storage.sync.get([key], (result) => {
            if (result[key] === undefined) {
                chrome.storage.sync.set({ [key]: value });
            }
        });
    });
});

// Track time spent on different domains
let timeTracker = {
    currentDomain: null,
    startTime: null,
    dailyStats: {}
};

// Listen for tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
        trackTimeSpent(tab.url);
    }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        trackTimeSpent(tab.url);
    }
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Browser lost focus
        stopTimeTracking();
    } else {
        // Browser gained focus
        const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
        if (tabs.length > 0 && tabs[0].url) {
            trackTimeSpent(tabs[0].url);
        }
    }
});

function trackTimeSpent(url) {
    try {
        const domain = new URL(url).hostname;
        const now = Date.now();
        const today = new Date().toDateString();
        
        // Stop previous tracking
        if (timeTracker.currentDomain && timeTracker.startTime) {
            const timeSpent = now - timeTracker.startTime;
            if (!timeTracker.dailyStats[today]) {
                timeTracker.dailyStats[today] = {};
            }
            if (!timeTracker.dailyStats[today][timeTracker.currentDomain]) {
                timeTracker.dailyStats[today][timeTracker.currentDomain] = 0;
            }
            timeTracker.dailyStats[today][timeTracker.currentDomain] += timeSpent;
        }
        
        // Start new tracking
        timeTracker.currentDomain = domain;
        timeTracker.startTime = now;
        
        // Save to storage
        chrome.storage.local.set({ 
            timeTracking: timeTracker.dailyStats 
        });
        
    } catch (error) {
        console.error('Error tracking time:', error);
    }
}

function stopTimeTracking() {
    if (timeTracker.currentDomain && timeTracker.startTime) {
        const now = Date.now();
        const today = new Date().toDateString();
        const timeSpent = now - timeTracker.startTime;
        
        if (!timeTracker.dailyStats[today]) {
            timeTracker.dailyStats[today] = {};
        }
        if (!timeTracker.dailyStats[today][timeTracker.currentDomain]) {
            timeTracker.dailyStats[today][timeTracker.currentDomain] = 0;
        }
        timeTracker.dailyStats[today][timeTracker.currentDomain] += timeSpent;
        
        chrome.storage.local.set({ 
            timeTracking: timeTracker.dailyStats 
        });
    }
    
    timeTracker.currentDomain = null;
    timeTracker.startTime = null;
}

// Clean up old time tracking data (keep only last 7 days)
function cleanupTimeTracking() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    chrome.storage.local.get(['timeTracking'], (result) => {
        if (result.timeTracking) {
            const cleaned = {};
            Object.keys(result.timeTracking).forEach(date => {
                const trackingDate = new Date(date);
                if (trackingDate >= sevenDaysAgo) {
                    cleaned[date] = result.timeTracking[date];
                }
            });
            chrome.storage.local.set({ timeTracking: cleaned });
        }
    });
}

// Reset daily counters at midnight
function resetDailyCounters() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
        // Reset Pomodoro count
        chrome.storage.sync.set({ 
            pomodoroCount: 0,
            lastActiveDate: new Date().toDateString()
        });
        
        // Clean up old tracking data
        cleanupTimeTracking();
        
        // Schedule next reset
        resetDailyCounters();
    }, timeUntilMidnight);
}

// Handle distraction blocking
function checkDistractingSites(url) {
    chrome.storage.sync.get(['focusMode', 'blockedSites'], (result) => {
        if (result.focusMode && result.blockedSites) {
            const domain = new URL(url).hostname;
            const isBlocked = result.blockedSites.some(site => 
                domain.includes(site) || site.includes(domain)
            );
            
            if (isBlocked) {
                // Redirect to focus page or show notification
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.update(tabs[0].id, {
                            url: chrome.runtime.getURL('focus.html')
                        });
                    }
                });
            }
        }
    });
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'TRACK_TIME':
            if (message.url) {
                trackTimeSpent(message.url);
            }
            break;
            
        case 'GET_TIME_STATS':
            const today = new Date().toDateString();
            sendResponse({
                stats: timeTracker.dailyStats[today] || {}
            });
            break;
            
        case 'CHECK_FOCUS_MODE':
            checkDistractingSites(message.url);
            break;
            
        case 'NOTIFICATION':
            if (chrome.notifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icon48.png',
                    title: message.title || 'NoBoringTab',
                    message: message.message
                });
            }
            break;
    }
});

// Initialize time tracking cleanup
chrome.storage.local.get(['timeTracking'], (result) => {
    if (result.timeTracking) {
        timeTracker.dailyStats = result.timeTracking;
    }
});

// Start daily reset timer
resetDailyCounters();

// Context menu for quick actions (optional)
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'openNoBoringTab',
        title: 'Open NoBoringTab',
        contexts: ['page']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openNoBoringTab') {
        chrome.tabs.create({ url: 'chrome://newtab/' });
    }
});

// Handle alarms for Pomodoro timer
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroTimer') {
        // Send message to active tab about timer completion
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'POMODORO_COMPLETE'
                });
            }
        });
        
        // Show notification
        if (chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icon48.png',
                title: 'Pomodoro Timer',
                message: 'Time\'s up! Take a break.'
            });
        }
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        trackTimeSpent,
        stopTimeTracking,
        cleanupTimeTracking
    };
}