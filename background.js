// Handle notifications permission
chrome.runtime.onInstalled.addListener(function() {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
});

// Initialize stats on install
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.get(['stats'], function(result) {
    if (!result.stats) {
      chrome.storage.sync.set({
        stats: {
          tabsOpened: 0,
          mostVisited: '-',
          timeBrowsing: 0,
          productivityScore: 0,
          domainVisits: {}
        }
      });
    }
  });
  
  // Set up alarms for daily reset
  chrome.alarms.create('dailyReset', {
    periodInMinutes: 24 * 60 // 24 hours
  });
});

// Track tabs being opened
chrome.tabs.onCreated.addListener(function(tab) {
  chrome.storage.sync.get(['stats'], function(result) {
    const stats = result.stats || {
      tabsOpened: 0,
      mostVisited: '-',
      timeBrowsing: 0,
      productivityScore: 0,
      domainVisits: {}
    };
    
    // Increment tabs opened count
    stats.tabsOpened++;
    
    chrome.storage.sync.set({ stats: stats });
  });
});

// Track tab navigation for domain stats
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    try {
      const url = new URL(changeInfo.url);
      const domain = url.hostname;
      
      if (domain) {
        chrome.storage.sync.get(['stats'], function(result) {
          const stats = result.stats || {
            tabsOpened: 0,
            mostVisited: '-',
            timeBrowsing: 0,
            productivityScore: 0,
            domainVisits: {}
          };
          
          // Update domain visits
          if (!stats.domainVisits[domain]) {
            stats.domainVisits[domain] = 1;
          } else {
            stats.domainVisits[domain]++;
          }
          
          // Find most visited domain
          let maxVisits = 0;
          let mostVisitedDomain = '-';
          
          for (const [dom, visits] of Object.entries(stats.domainVisits)) {
            if (visits > maxVisits) {
              maxVisits = visits;
              mostVisitedDomain = dom;
            }
          }
          
          stats.mostVisited = mostVisitedDomain;
          
          // Simple productivity score calculation
          // For demo purposes - production version would use a more sophisticated algorithm
          const productivityDomains = [
            'github.com',
            'stackoverflow.com',
            'medium.com',
            'docs.google.com',
            'udemy.com',
            'coursera.org',
            'edx.org',
            'khanacademy.org'
          ];
          
          let productiveVisits = 0;
          let totalVisits = 0;
          
          for (const [dom, visits] of Object.entries(stats.domainVisits)) {
            totalVisits += visits;
            if (productivityDomains.some(prodDomain => dom.includes(prodDomain))) {
              productiveVisits += visits;
            }
          }
          
          if (totalVisits > 0) {
            stats.productivityScore = Math.round((productiveVisits / totalVisits) * 100);
          }
          
          chrome.storage.sync.set({ stats: stats });
        });
      }
    } catch (e) {
      // Invalid URL, ignore
    }
  }
});

// Track browsing time
let activeTabStartTime = null;

chrome.tabs.onActivated.addListener(function() {
  activeTabStartTime = Date.now();
});

chrome.windows.onFocusChanged.addListener(function(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Window lost focus, stop tracking time
    if (activeTabStartTime) {
      const sessionTime = Math.round((Date.now() - activeTabStartTime) / 60000); // in minutes
      
      if (sessionTime > 0) {
        chrome.storage.sync.get(['stats'], function(result) {
          const stats = result.stats || {
            tabsOpened: 0,
            mostVisited: '-',
            timeBrowsing: 0,
            productivityScore: 0,
            domainVisits: {}
          };
          
          stats.timeBrowsing += sessionTime;
          
          chrome.storage.sync.set({ stats: stats });
        });
      }
      
      activeTabStartTime = null;
    }
  } else {
    // Window gained focus, start tracking time
    activeTabStartTime = Date.now();
  }
});

// Reset daily stats
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'dailyReset') {
    chrome.storage.sync.get(['stats'], function(result) {
      const stats = result.stats || {};
      
      // Save historical data if needed before resetting
      // For a real extension, you might want to store historical data elsewhere
      
      // Reset daily stats
      chrome.storage.sync.set({
        stats: {
          tabsOpened: 0,
          mostVisited: '-',
          timeBrowsing: 0,
          productivityScore: 0,
          domainVisits: {}
        }
      });
    });
  }
});