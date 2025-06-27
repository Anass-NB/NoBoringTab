// Quote Box component for NoBoringTab

class QuoteBoxComponent {
    constructor() {
        this.currentQuote = null;
        this.quoteHistory = [];
        this.maxHistorySize = 50;
        this.categories = ['motivational', 'inspirational', 'success', 'life', 'wisdom'];
        this.currentCategory = 'motivational';
        
        // DOM elements
        this.quoteElement = null;
        this.authorElement = null;
        this.newQuoteButton = null;
        this.quoteContainer = null;
        
        // API endpoints
        this.apis = [
            {
                name: 'quotable',
                url: 'https://api.quotable.io/random',
                parseResponse: (data) => ({
                    text: data.content,
                    author: data.author,
                    category: data.tags?.[0] || 'general'
                })
            },
            {
                name: 'quotegarden',
                url: 'https://quotegarden.p.rapidapi.com/api/v3/quotes/random',
                headers: {
                    'X-RapidAPI-Key': 'your-rapidapi-key', // Users need to add their key
                    'X-RapidAPI-Host': 'quotegarden.p.rapidapi.com'
                },
                parseResponse: (data) => ({
                    text: data.data?.[0]?.quoteText?.replace(/^"|"$/g, ''),
                    author: data.data?.[0]?.quoteAuthor,
                    category: data.data?.[0]?.quoteGenre || 'general'
                })
            }
        ];
        
        // Fallback quotes for offline use
        this.fallbackQuotes = [
            {
                text: "The only way to do great work is to love what you do.",
                author: "Steve Jobs",
                category: "motivational"
            },
            {
                text: "Life is what happens to you while you're busy making other plans.",
                author: "John Lennon",
                category: "life"
            },
            {
                text: "The future belongs to those who believe in the beauty of their dreams.",
                author: "Eleanor Roosevelt",
                category: "inspirational"
            },
            {
                text: "It is during our darkest moments that we must focus to see the light.",
                author: "Aristotle",
                category: "wisdom"
            },
            {
                text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                author: "Winston Churchill",
                category: "success"
            },
            {
                text: "The only impossible journey is the one you never begin.",
                author: "Tony Robbins",
                category: "motivational"
            },
            {
                text: "In the middle of difficulty lies opportunity.",
                author: "Albert Einstein",
                category: "wisdom"
            },
            {
                text: "Believe you can and you're halfway there.",
                author: "Theodore Roosevelt",
                category: "inspirational"
            }
        ];
        
        this.init();
    }

    async init() {
        // Get DOM elements
        this.quoteElement = document.getElementById('daily-quote');
        this.authorElement = document.getElementById('quote-author');
        this.newQuoteButton = document.getElementById('new-quote');
        this.quoteContainer = document.getElementById('quote-container');
        
        // Load saved data
        await this.loadSavedData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial quote
        await this.loadQuote();
        
        // Setup daily refresh
        this.setupDailyRefresh();
    }

    setupEventListeners() {
        // New quote button
        this.newQuoteButton?.addEventListener('click', () => {
            this.loadNewQuote();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'q' && e.ctrlKey) {
                e.preventDefault();
                this.loadNewQuote();
            }
        });
        
        // Quote sharing (click to copy)
        this.quoteContainer?.addEventListener('click', (e) => {
            if (e.target === this.quoteElement || e.target === this.authorElement) {
                this.copyQuoteToClipboard();
            }
        });
    }

    async loadSavedData() {
        try {
            let savedData = {};
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get([
                    'currentQuote',
                    'quoteHistory',
                    'lastQuoteDate',
                    'quoteCategory'
                ]);
                savedData = result;
            } else {
                // Fallback to localStorage
                const current = localStorage.getItem('noboringtab_currentQuote');
                const history = localStorage.getItem('noboringtab_quoteHistory');
                const date = localStorage.getItem('noboringtab_lastQuoteDate');
                const category = localStorage.getItem('noboringtab_quoteCategory');
                
                savedData = {
                    currentQuote: current ? JSON.parse(current) : null,
                    quoteHistory: history ? JSON.parse(history) : [],
                    lastQuoteDate: date,
                    quoteCategory: category || 'motivational'
                };
            }
            
            this.currentQuote = savedData.currentQuote;
            this.quoteHistory = savedData.quoteHistory || [];
            this.lastQuoteDate = savedData.lastQuoteDate;
            this.currentCategory = savedData.quoteCategory || 'motivational';
            
        } catch (error) {
            console.error('Error loading saved quote data:', error);
        }
    }

    async saveData() {
        try {
            const data = {
                currentQuote: this.currentQuote,
                quoteHistory: this.quoteHistory.slice(-this.maxHistorySize), // Keep only recent quotes
                lastQuoteDate: new Date().toDateString(),
                quoteCategory: this.currentCategory
            };
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set(data);
            } else {
                // Fallback to localStorage
                Object.entries(data).forEach(([key, value]) => {
                    localStorage.setItem(`noboringtab_${key}`, JSON.stringify(value));
                });
            }
        } catch (error) {
            console.error('Error saving quote data:', error);
        }
    }

    async loadQuote() {
        // Check if we need a new daily quote
        const today = new Date().toDateString();
        if (this.currentQuote && this.lastQuoteDate === today) {
            this.displayQuote(this.currentQuote);
            return;
        }
        
        // Load new quote
        await this.loadNewQuote();
    }

    async loadNewQuote() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Try to fetch from API
            const quote = await this.fetchQuoteFromAPI();
            
            if (quote) {
                this.setCurrentQuote(quote);
            } else {
                // Use fallback quote
                const fallbackQuote = this.getFallbackQuote();
                this.setCurrentQuote(fallbackQuote);
            }
            
        } catch (error) {
            console.error('Error loading new quote:', error);
            
            // Use fallback quote
            const fallbackQuote = this.getFallbackQuote();
            this.setCurrentQuote(fallbackQuote);
        }
    }

    async fetchQuoteFromAPI() {
        // Try each API endpoint
        for (const api of this.apis) {
            try {
                const url = this.buildAPIUrl(api);
                const options = {
                    method: 'GET',
                    headers: api.headers || {}
                };
                
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    continue; // Try next API
                }
                
                const data = await response.json();
                const quote = api.parseResponse(data);
                
                // Validate quote
                if (quote.text && quote.author) {
                    return quote;
                }
                
            } catch (error) {
                console.error(`Error with ${api.name} API:`, error);
                continue; // Try next API
            }
        }
        
        return null; // All APIs failed
    }

    buildAPIUrl(api) {
        let url = api.url;
        
        // Add category/tag parameters
        if (api.name === 'quotable') {
            if (this.currentCategory && this.currentCategory !== 'general') {
                url += `?tags=${this.currentCategory}`;
            }
        }
        
        return url;
    }

    getFallbackQuote() {
        // Filter by category if specified
        let quotes = this.fallbackQuotes;
        if (this.currentCategory && this.currentCategory !== 'general') {
            const categoryQuotes = quotes.filter(q => q.category === this.currentCategory);
            if (categoryQuotes.length > 0) {
                quotes = categoryQuotes;
            }
        }
        
        // Avoid recent quotes
        const recentTexts = this.quoteHistory.slice(-5).map(q => q.text);
        const availableQuotes = quotes.filter(q => !recentTexts.includes(q.text));
        
        const quotesToUse = availableQuotes.length > 0 ? availableQuotes : quotes;
        const randomIndex = Math.floor(Math.random() * quotesToUse.length);
        
        return quotesToUse[randomIndex];
    }

    setCurrentQuote(quote) {
        this.currentQuote = quote;
        
        // Add to history
        this.quoteHistory.push({
            ...quote,
            timestamp: new Date().toISOString()
        });
        
        // Display quote
        this.displayQuote(quote);
        
        // Save data
        this.saveData();
        
        // Show notification
        this.showNotification('New quote loaded!', 'info');
    }

    displayQuote(quote) {
        if (!quote || !this.quoteElement || !this.authorElement) return;
        
        // Animate out current quote
        this.animateQuoteChange(() => {
            // Update content
            this.quoteElement.textContent = `"${quote.text}"`;
            this.authorElement.textContent = `— ${quote.author}`;
            
            // Add category tag if available
            if (quote.category) {
                const categoryTag = document.createElement('span');
                categoryTag.className = 'quote-category text-xs opacity-60 ml-2';
                categoryTag.textContent = `#${quote.category}`;
                this.authorElement.appendChild(categoryTag);
            }
        });
    }

    animateQuoteChange(callback) {
        if (!this.quoteContainer) {
            callback();
            return;
        }
        
        // Fade out
        this.quoteContainer.style.opacity = '0';
        this.quoteContainer.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            callback();
            
            // Fade in
            this.quoteContainer.style.opacity = '1';
            this.quoteContainer.style.transform = 'translateY(0)';
        }, 300);
    }

    showLoadingState() {
        if (this.quoteElement) {
            this.quoteElement.textContent = '"Loading inspirational quote..."';
        }
        if (this.authorElement) {
            this.authorElement.textContent = '— Loading...';
        }
    }

    setupDailyRefresh() {
        // Calculate time until next midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        // Set timeout for midnight refresh
        setTimeout(() => {
            this.loadNewQuote();
            
            // Set up daily interval
            setInterval(() => {
                this.loadNewQuote();
            }, 24 * 60 * 60 * 1000); // 24 hours
            
        }, timeUntilMidnight);
    }

    async copyQuoteToClipboard() {
        if (!this.currentQuote) return;
        
        const quoteText = `"${this.currentQuote.text}" — ${this.currentQuote.author}`;
        
        try {
            await navigator.clipboard.writeText(quoteText);
            this.showNotification('Quote copied to clipboard!', 'success');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showNotification('Failed to copy quote', 'error');
        }
    }

    setCategory(category) {
        this.currentCategory = category;
        this.saveData();
        this.loadNewQuote();
    }

    getQuoteHistory() {
        return this.quoteHistory;
    }

    getFavoriteQuotes() {
        // Could be extended to allow users to mark quotes as favorites
        return this.quoteHistory.filter(quote => quote.favorite);
    }

    markAsFavorite(quoteText) {
        const quote = this.quoteHistory.find(q => q.text === quoteText);
        if (quote) {
            quote.favorite = !quote.favorite;
            this.saveData();
        }
    }

    exportQuotes() {
        const data = {
            quotes: this.quoteHistory,
            currentQuote: this.currentQuote,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `noboringtab-quotes-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Quotes exported successfully!', 'success');
    }

    shareQuote(platform = 'twitter') {
        if (!this.currentQuote) return;
        
        const quoteText = `"${this.currentQuote.text}" — ${this.currentQuote.author}`;
        const url = encodeURIComponent(window.location.href);
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(quoteText)}&url=${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(quoteText)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${encodeURIComponent(quoteText)}`,
            reddit: `https://reddit.com/submit?url=${url}&title=${encodeURIComponent(quoteText)}`
        };
        
        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    showNotification(message, type = 'info') {
        if (window.Utils && window.Utils.Notification) {
            window.Utils.Notification.show(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    getStats() {
        return {
            totalQuotes: this.quoteHistory.length,
            currentQuote: this.currentQuote,
            category: this.currentCategory,
            favoriteCount: this.quoteHistory.filter(q => q.favorite).length,
            lastUpdated: this.lastQuoteDate
        };
    }
}

// Initialize quote component when DOM is loaded
let quoteBoxComponent;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        quoteBoxComponent = new QuoteBoxComponent();
    });
} else {
    quoteBoxComponent = new QuoteBoxComponent();
}

// Export for global access
window.quoteBoxComponent = quoteBoxComponent;