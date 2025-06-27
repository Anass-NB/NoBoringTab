# Installation Guide for NoBoringTab

## Quick Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download the Extension**
   - Download or clone this repository to your local machine
   - Extract the files if downloaded as ZIP

2. **Open Chrome Extensions**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Chrome Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner
   - This enables the "Load unpacked" button

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `NoBoringTab` folder (the one containing `manifest.json`)
   - The extension should appear in your extensions list

5. **Verify Installation**
   - Open a new tab - you should see the NoBoringTab interface
   - If you see the default Chrome new tab, try refreshing or restarting Chrome

### Method 2: Pack and Install (For Distribution)

1. **Pack the Extension**
   - In Chrome extensions page, click "Pack extension"
   - Select the `NoBoringTab` folder as the extension root directory
   - This creates a `.crx` file

2. **Install Packed Extension**
   - Drag and drop the `.crx` file onto the Chrome extensions page
   - Click "Add Extension" when prompted

## First-Time Setup

### Basic Configuration

1. **Open New Tab**
   - The extension should load automatically
   - You'll see the NoBoringTab dashboard

2. **Configure Settings** (Click the gear icon ⚙️)
   - **Your Name**: Enter your name for personalized greetings
   - **Background Source**: Choose Unsplash, Gradient, or Solid Color
   - **Weather Location**: Enter your city or use "auto" for geolocation

3. **Add Quick Access Links**
   - Click the "+" button in the Quick Access section
   - Add your frequently visited websites

### API Keys Setup (Optional but Recommended)

#### Weather API (Free)
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Open the extension files and edit `scripts/utils.js`:
   ```javascript
   const CONFIG = {
       OPENWEATHER_API_KEY: 'your-api-key-here'
   };
   ```

#### GitHub Integration (Optional)
1. Enter your GitHub username in the GitHub widget
2. For higher API limits, create a personal access token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a token with public repo access
   - Edit `scripts/utils.js` and add the token

## Troubleshooting

### Extension Not Loading
- **Check manifest.json**: Ensure the file is valid JSON
- **Refresh extensions**: Go to `chrome://extensions/` and click refresh
- **Check permissions**: Make sure the extension has the necessary permissions
- **Console errors**: Right-click on new tab → Inspect → Console for errors

### Features Not Working
- **API Keys**: Ensure API keys are correctly set in the configuration
- **Network Issues**: Check if you're behind a firewall blocking API calls
- **Storage Permissions**: The extension needs storage permissions for saving data

### Weather Not Showing
- **API Key**: Make sure OpenWeatherMap API key is set
- **Location**: Try using a specific city name instead of "auto"
- **Geolocation**: Allow location access when prompted

### Background Images Not Loading
- **Network**: Check internet connection
- **CORS**: Some corporate networks block external image requests
- **Fallback**: The extension should fallback to gradients if images fail

## Development Setup

### For Developers

1. **Clone Repository**
   ```bash
   git clone https://github.com/Anass-NB/NoBoringTab.git
   cd NoBoringTab
   ```

2. **Development Mode**
   - Load unpacked extension as described above
   - Make changes to files
   - Refresh extension in `chrome://extensions/`
   - Open new tab to test changes

3. **Debug Console**
   ```javascript
   // Access components in console
   window.app              // Main application
   window.todoManager      // Todo functionality
   window.pomodoroTimer    // Timer functionality
   window.clockComponent   // Clock and greeting
   window.weatherComponent // Weather widget
   window.quoteBoxComponent // Quote functionality
   ```

### File Structure for Development
```
NoBoringTab/
├── manifest.json        # Extension configuration
├── index.html          # Main HTML file
├── scripts/
│   ├── main.js         # Main app logic
│   ├── utils.js        # Utilities (edit API keys here)
│   ├── background.js   # Service worker
│   ├── todo.js         # Todo list
│   └── timer.js        # Pomodoro timer
├── components/
│   ├── Clock.js        # Clock component
│   ├── Weather.js      # Weather component
│   └── QuoteBox.js     # Quote component
├── styles/
│   └── tailwind.css    # Custom styles
└── assets/
    └── *.png           # Extension icons
```

## Security Notes

### Data Privacy
- All personal data stored locally in browser
- No data sent to third parties except API calls
- API calls are standard HTTP requests for public data

### Permissions Explained
- `storage`: Save settings and data locally
- `tabs`: Track time spent on domains (optional feature)
- `https://api.*`: Access external APIs for weather, quotes, etc.
- `geolocation`: Get location for weather (optional)

### Safe Usage
- Review all API keys before adding them
- Use official API endpoints only
- Keep the extension updated for security patches

## Updates

### Automatic Updates
- Extensions loaded from Chrome Web Store update automatically
- Unpacked extensions require manual updates

### Manual Updates
1. Download new version
2. Replace old files with new ones
3. Go to `chrome://extensions/`
4. Click refresh button for NoBoringTab
5. Open new tab to see updates

## Uninstall

### Remove Extension
1. Go to `chrome://extensions/`
2. Find NoBoringTab
3. Click "Remove" button
4. Confirm removal

### Clean Up Data
- Extension data is automatically removed
- For complete cleanup, clear browser storage:
  - Chrome Settings → Privacy and security → Clear browsing data
  - Select "Cookies and other site data"
  - Choose time range and clear

## Support

### Getting Help
- **Issues**: Check [GitHub Issues](https://github.com/Anass-NB/NoBoringTab/issues)
- **Documentation**: Read this README and code comments
- **Community**: Join discussions on GitHub

### Reporting Bugs
1. Check existing issues first
2. Include Chrome version and OS
3. Describe steps to reproduce
4. Include console error messages if any
5. Attach screenshots if helpful

### Feature Requests
1. Search existing requests
2. Describe the feature clearly
3. Explain the use case
4. Consider implementation complexity

---

**Happy Productivity with NoBoringTab! 🚀**