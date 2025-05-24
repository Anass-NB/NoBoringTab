document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme and background
  initializeTheme();
  initializeBackground();
  
  // Initialize settings panel
  document.getElementById('settings-btn').addEventListener('click', toggleSettingsPanel);
  document.getElementById('close-settings').addEventListener('click', toggleSettingsPanel);
  
  // Initialize background customizer
  initializeBackgroundCustomizer();
  
  // Initialize time and date display
  updateTimeAndDate();
  setInterval(updateTimeAndDate, 1000);
  
  // Initialize todo list
  loadTodos();
  document.getElementById('add-todo').addEventListener('click', showTodoForm);
  document.getElementById('save-todo').addEventListener('click', saveTodo);
  document.getElementById('cancel-todo').addEventListener('click', hideTodoForm);
  
  // Initialize quote
  loadQuote();
  document.getElementById('new-quote').addEventListener('click', loadQuote);
  
  // Initialize Spotify
  initializeSpotify();
  document.getElementById('spotify-save-btn').addEventListener('click', saveSpotifyPlaylist);
  
  // Initialize agenda
  loadAgendaItems();
  document.getElementById('add-agenda-item').addEventListener('click', showAgendaForm);
  document.getElementById('save-event').addEventListener('click', saveAgendaItem);
  document.getElementById('cancel-event').addEventListener('click', hideAgendaForm);
  
  // Initialize blogs
  loadBlogs();
  document.getElementById('add-blog').addEventListener('click', showBlogForm);
  document.getElementById('save-blog').addEventListener('click', saveBlog);
  document.getElementById('cancel-blog').addEventListener('click', hideBlogForm);
  
  // Initialize stats
  loadStats();
});

// Theme and Background Functions
function initializeTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  
  // Load saved theme
  chrome.storage.sync.get(['darkMode'], function(result) {
    const isDarkMode = result.darkMode || false;
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  });
  
  // Theme toggle functionality
  themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    chrome.storage.sync.set({ darkMode: isDarkMode });
    
    if (isDarkMode) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  });
}

function toggleSettingsPanel() {
  const settingsPanel = document.getElementById('settings-panel');
  settingsPanel.classList.toggle('open');
}

function initializeBackground() {
  chrome.storage.sync.get(['background'], function(result) {
    const bg = result.background || { type: 'default' };
    applyBackground(bg);
  });
}

function initializeBackgroundCustomizer() {
  const bgTypeRadios = document.querySelectorAll('input[name="bg-type"]');
  const gradientOptions = document.getElementById('gradient-options');
  const imageOptions = document.getElementById('image-options');
  const customUrlOptions = document.getElementById('custom-url-options');
  
  // Background type selection
  bgTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      // Hide all option sections
      gradientOptions.classList.add('hidden');
      imageOptions.classList.add('hidden');
      customUrlOptions.classList.add('hidden');
      
      // Show relevant section
      if (this.value === 'gradient') {
        gradientOptions.classList.remove('hidden');
        updateGradientPreview();
      } else if (this.value === 'image') {
        imageOptions.classList.remove('hidden');
      } else if (this.value === 'custom') {
        customUrlOptions.classList.remove('hidden');
      }
    });
  });
  
  // Gradient color pickers
  const gradientColor1 = document.getElementById('gradient-color1');
  const gradientColor2 = document.getElementById('gradient-color2');
  
  gradientColor1.addEventListener('input', updateGradientPreview);
  gradientColor2.addEventListener('input', updateGradientPreview);
  
  // File upload for custom background
  const fileUpload = document.getElementById('bg-file-upload');
  const previewImage = document.getElementById('preview-image');
  
  fileUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        previewImage.src = event.target.result;
        previewImage.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Save background settings
  document.getElementById('save-bg').addEventListener('click', saveBackground);
  
  // Load existing background settings
  chrome.storage.sync.get(['background'], function(result) {
    const bg = result.background || { type: 'default' };
    
    // Set the radio button
    const radioToCheck = document.getElementById('bg-' + bg.type);
    if (radioToCheck) {
      radioToCheck.checked = true;
      
      // Show relevant options
      if (bg.type === 'gradient') {
        gradientOptions.classList.remove('hidden');
        if (bg.color1) document.getElementById('gradient-color1').value = bg.color1;
        if (bg.color2) document.getElementById('gradient-color2').value = bg.color2;
        updateGradientPreview();
      } else if (bg.type === 'image') {
        imageOptions.classList.remove('hidden');
        if (bg.imageOption) document.getElementById('bg-image-select').value = bg.imageOption;
      } else if (bg.type === 'custom') {
        customUrlOptions.classList.remove('hidden');
        if (bg.customImgData) {
          previewImage.src = bg.customImgData;
          previewImage.style.display = 'block';
        }
      }
    }
  });
}

function updateGradientPreview() {
  const color1 = document.getElementById('gradient-color1').value;
  const color2 = document.getElementById('gradient-color2').value;
  const preview = document.getElementById('custom-bg-preview');
  
  preview.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

function saveBackground() {
  const selectedType = document.querySelector('input[name="bg-type"]:checked').value;
  const bgSettings = { type: selectedType };
  
  if (selectedType === 'gradient') {
    bgSettings.color1 = document.getElementById('gradient-color1').value;
    bgSettings.color2 = document.getElementById('gradient-color2').value;
  } else if (selectedType === 'image') {
    bgSettings.imageOption = document.getElementById('bg-image-select').value;
  } else if (selectedType === 'custom') {
    const previewImage = document.getElementById('preview-image');
    if (previewImage.src) {
      bgSettings.customImgData = previewImage.src;
    }
  }
  
  chrome.storage.sync.set({ background: bgSettings }, function() {
    applyBackground(bgSettings);
    toggleSettingsPanel();
  });
}

function applyBackground(bgSettings) {
  // Remove all background classes first
  document.body.classList.remove('custom-bg', 'gradient-bg', 'image-bg');
  document.body.style.removeProperty('--custom-bg-image');
  document.body.style.removeProperty('--custom-gradient');
  
  if (bgSettings.type === 'default') {
    // Default gradient is in CSS
    return;
  } else if (bgSettings.type === 'gradient') {
    document.body.classList.add('gradient-bg');
    const gradient = `linear-gradient(135deg, ${bgSettings.color1} 0%, ${bgSettings.color2} 100%)`;
    document.body.style.setProperty('--custom-gradient', gradient);
  } else if (bgSettings.type === 'image') {
    document.body.classList.add('custom-bg', 'image-bg');
    
    // Predefined backgrounds
    const backgroundImages = {
      mountains: 'https://source.unsplash.com/1920x1080/?mountains',
      ocean: 'https://source.unsplash.com/1920x1080/?ocean',
      forest: 'https://source.unsplash.com/1920x1080/?forest',
      cityscape: 'https://source.unsplash.com/1920x1080/?cityscape',
      abstract: 'https://source.unsplash.com/1920x1080/?abstract'
    };
    
    document.body.style.setProperty('--custom-bg-image', `url(${backgroundImages[bgSettings.imageOption]})`);
  } else if (bgSettings.type === 'custom') {
    document.body.classList.add('custom-bg', 'image-bg');
    if (bgSettings.customImgData) {
      document.body.style.setProperty('--custom-bg-image', `url(${bgSettings.customImgData})`);
    }
  }
}

// Spotify Functions
function initializeSpotify() {
  chrome.storage.sync.get(['spotifyPlaylist'], function(result) {
    if (result.spotifyPlaylist) {
      updateSpotifyIframe(result.spotifyPlaylist);
      document.getElementById('spotify-url-input').value = result.spotifyPlaylist;
    }
  });
}

function saveSpotifyPlaylist() {
  const spotifyUrl = document.getElementById('spotify-url-input').value.trim();
  
  if (!spotifyUrl) return;
  
  // Extract playlist ID from various Spotify URL formats
  let playlistId = spotifyUrl;
  
  if (spotifyUrl.includes('spotify.com/playlist/')) {
    const matches = spotifyUrl.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
    if (matches && matches[1]) {
      playlistId = matches[1];
    }
  } else if (spotifyUrl.includes('spotify:playlist:')) {
    const matches = spotifyUrl.match(/spotify:playlist:([a-zA-Z0-9]+)/);
    if (matches && matches[1]) {
      playlistId = matches[1];
    }
  }
  
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
  chrome.storage.sync.set({ spotifyPlaylist: playlistId }, function() {
    updateSpotifyIframe(playlistId);
  });
}

function updateSpotifyIframe(playlistId) {
  const iframe = document.getElementById('spotify-playlist');
  iframe.src = `https://open.spotify.com/embed/playlist/${playlistId}`;
}

// Time and Date Functions
function updateTimeAndDate() {
  const now = new Date();
  document.getElementById('current-time').textContent = now.toLocaleTimeString();
  document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Todo List Functions
function loadTodos() {
  chrome.storage.sync.get(['todos'], function(result) {
    const todos = result.todos || [];
    renderTodoList(todos);
    updateUpcomingDates(todos);
  });
}

function renderTodoList(todos) {
  const todoList = document.getElementById('todo-list');
  todoList.innerHTML = '';
  
  if (todos.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No tasks yet. Add one!';
    emptyMessage.style.color = 'var(--light-text)';
    todoList.appendChild(emptyMessage);
    return;
  }
  
  todos.sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });
  
  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = todo.completed ? 'todo-completed' : '';
    
    const todoItem = document.createElement('div');
    todoItem.className = 'todo-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(index));
    
    const todoText = document.createElement('span');
    todoText.className = 'todo-text';
    todoText.textContent = todo.text;
    
    todoItem.appendChild(checkbox);
    todoItem.appendChild(todoText);
    
    const todoActions = document.createElement('div');
    todoActions.className = 'todo-actions';
    
    if (todo.dueDate) {
      const todoDate = document.createElement('span');
      todoDate.className = 'todo-date';
      const dueDate = new Date(todo.dueDate);
      todoDate.textContent = dueDate.toLocaleDateString();
      todoActions.appendChild(todoDate);
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', () => deleteTodo(index));
    todoActions.appendChild(deleteBtn);
    
    li.appendChild(todoItem);
    li.appendChild(todoActions);
    todoList.appendChild(li);
  });
}

function updateUpcomingDates(todos) {
  const upcomingList = document.getElementById('upcoming-list');
  upcomingList.innerHTML = '';
  
  const upcomingTodos = todos.filter(todo => {
    if (!todo.dueDate || todo.completed) return false;
    const dueDate = new Date(todo.dueDate);
    const now = new Date();
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });
  
  upcomingTodos.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
  if (upcomingTodos.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No upcoming due dates this week';
    emptyMessage.style.color = 'var(--light-text)';
    upcomingList.appendChild(emptyMessage);
    return;
  }
  
  upcomingTodos.forEach(todo => {
    const li = document.createElement('li');
    
    const dueDate = new Date(todo.dueDate);
    const now = new Date();
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let dueDateText;
    if (diffDays === 0) {
      dueDateText = 'Today';
    } else if (diffDays === 1) {
      dueDateText = 'Tomorrow';
    } else {
      dueDateText = `In ${diffDays} days`;
    }
    
    li.innerHTML = `
      <div class="upcoming-item">
        <span class="upcoming-text">${todo.text}</span>
      </div>
      <div class="upcoming-date">
        <span>${dueDateText} (${dueDate.toLocaleDateString()})</span>
      </div>
    `;
    
    upcomingList.appendChild(li);
  });
}

function showTodoForm() {
  document.getElementById('todo-form').classList.remove('hidden');
  document.getElementById('new-todo').focus();
}

function hideTodoForm() {
  document.getElementById('todo-form').classList.add('hidden');
  document.getElementById('new-todo').value = '';
  document.getElementById('todo-date').value = '';
}

function saveTodo() {
  const todoText = document.getElementById('new-todo').value.trim();
  const todoDate = document.getElementById('todo-date').value;
  
  if (!todoText) return;
  
  chrome.storage.sync.get(['todos'], function(result) {
    const todos = result.todos || [];
    todos.push({
      text: todoText,
      completed: false,
      dueDate: todoDate || null,
      createdAt: new Date().toISOString()
    });
    
    chrome.storage.sync.set({ todos: todos }, function() {
      renderTodoList(todos);
      updateUpcomingDates(todos);
      hideTodoForm();
    });
  });
}

function toggleTodo(index) {
  chrome.storage.sync.get(['todos'], function(result) {
    const todos = result.todos || [];
    todos[index].completed = !todos[index].completed;
    
    chrome.storage.sync.set({ todos: todos }, function() {
      renderTodoList(todos);
      updateUpcomingDates(todos);
    });
  });
}

function deleteTodo(index) {
  chrome.storage.sync.get(['todos'], function(result) {
    const todos = result.todos || [];
    todos.splice(index, 1);
    
    chrome.storage.sync.set({ todos: todos }, function() {
      renderTodoList(todos);
      updateUpcomingDates(todos);
    });
  });
}

// Quote Functions
function loadQuote() {
  fetch('https://api.quotable.io/random?tags=inspirational,success,education')
    .then(response => response.json())
    .then(data => {
      document.getElementById('quote-text').textContent = `"${data.content}"`;
      document.getElementById('quote-author').textContent = `— ${data.author}`;
    })
    .catch(() => {
      // Fallback quotes if API fails
      const fallbackQuotes = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" }
      ];
      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      document.getElementById('quote-text').textContent = `"${randomQuote.text}"`;
      document.getElementById('quote-author').textContent = `— ${randomQuote.author}`;
    });
}

// Agenda Functions
function loadAgendaItems() {
  chrome.storage.sync.get(['agenda'], function(result) {
    const agendaItems = result.agenda || [];
    renderAgendaList(agendaItems);
  });
}

function renderAgendaList(agendaItems) {
  const agendaList = document.getElementById('agenda-list');
  agendaList.innerHTML = '';
  
  if (agendaItems.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No events for today';
    emptyMessage.style.color = 'var(--light-text)';
    agendaList.appendChild(emptyMessage);
    return;
  }
  
  agendaItems.sort((a, b) => a.time.localeCompare(b.time));
  
  agendaItems.forEach((item, index) => {
    const li = document.createElement('li');
    
    li.innerHTML = `
      <div class="agenda-item">
        <span class="agenda-time">${formatTime(item.time)}</span>
        <span class="agenda-title">${item.title}</span>
      </div>
      <div class="agenda-actions">
        <button class="delete-agenda"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    li.querySelector('.delete-agenda').addEventListener('click', () => deleteAgendaItem(index));
    agendaList.appendChild(li);
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showAgendaForm() {
  document.getElementById('agenda-form').classList.remove('hidden');
  document.getElementById('event-title').focus();
}

function hideAgendaForm() {
  document.getElementById('agenda-form').classList.add('hidden');
  document.getElementById('event-title').value = '';
  document.getElementById('event-time').value = '';
}

function saveAgendaItem() {
  const eventTitle = document.getElementById('event-title').value.trim();
  const eventTime = document.getElementById('event-time').value;
  
  if (!eventTitle || !eventTime) return;
  
  chrome.storage.sync.get(['agenda'], function(result) {
    const agendaItems = result.agenda || [];
    agendaItems.push({
      title: eventTitle,
      time: eventTime
    });
    
    chrome.storage.sync.set({ agenda: agendaItems }, function() {
      renderAgendaList(agendaItems);
      hideAgendaForm();
    });
  });
}

function deleteAgendaItem(index) {
  chrome.storage.sync.get(['agenda'], function(result) {
    const agendaItems = result.agenda || [];
    agendaItems.splice(index, 1);
    
    chrome.storage.sync.set({ agenda: agendaItems }, function() {
      renderAgendaList(agendaItems);
    });
  });
}

// Blog Functions
function loadBlogs() {
  chrome.storage.sync.get(['blogs'], function(result) {
    let blogs = result.blogs || [];
    
    // Add default blogs if none exist
    if (blogs.length === 0) {
      blogs = [
        { title: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/', category: 'Web Development' },
        { title: 'A List Apart', url: 'https://alistapart.com/', category: 'Web Design' },
        { title: 'CSS-Tricks', url: 'https://css-tricks.com/', category: 'CSS' },
        { title: 'freeCodeCamp', url: 'https://www.freecodecamp.org/news/', category: 'Programming' },
        { title: 'Dev.to', url: 'https://dev.to/', category: 'Development Community' }
      ];
      chrome.storage.sync.set({ blogs: blogs });
    }
    
    renderBlogList(blogs);
  });
}

function renderBlogList(blogs) {
  const blogList = document.getElementById('blog-list');
  blogList.innerHTML = '';
  
  blogs.forEach((blog, index) => {
    const li = document.createElement('li');
    
    li.innerHTML = `
      <div class="blog-item">
        <a href="${blog.url}" class="blog-link" target="_blank">
          <span class="blog-title">${blog.title}</span>
          ${blog.category ? `<span class="blog-category">${blog.category}</span>` : ''}
        </a>
      </div>
      <div class="blog-actions">
        <button class="delete-blog"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    li.querySelector('.delete-blog').addEventListener('click', () => deleteBlog(index));
    blogList.appendChild(li);
  });
}

function showBlogForm() {
  document.getElementById('blog-form').classList.remove('hidden');
  document.getElementById('blog-title').focus();
}

function hideBlogForm() {
  document.getElementById('blog-form').classList.add('hidden');
  document.getElementById('blog-title').value = '';
  document.getElementById('blog-url').value = '';
  document.getElementById('blog-category').value = '';
}

function saveBlog() {
  const blogTitle = document.getElementById('blog-title').value.trim();
  const blogUrl = document.getElementById('blog-url').value.trim();
  const blogCategory = document.getElementById('blog-category').value.trim();
  
  if (!blogTitle || !blogUrl) return;
  
  // Add http:// if not present
  let url = blogUrl;
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  chrome.storage.sync.get(['blogs'], function(result) {
    const blogs = result.blogs || [];
    blogs.push({
      title: blogTitle,
      url: url,
      category: blogCategory
    });
    
    chrome.storage.sync.set({ blogs: blogs }, function() {
      renderBlogList(blogs);
      hideBlogForm();
    });
  });
}

function deleteBlog(index) {
  chrome.storage.sync.get(['blogs'], function(result) {
    const blogs = result.blogs || [];
    blogs.splice(index, 1);
    
    chrome.storage.sync.set({ blogs: blogs }, function() {
      renderBlogList(blogs);
    });
  });
}

// Stats Functions
function loadStats() {
  chrome.storage.sync.get(['stats'], function(result) {
    const stats = result.stats || {
      tabsOpened: 0,
      mostVisited: '-',
      timeBrowsing: 0,
      productivityScore: 0
    };
    
    document.getElementById('tabs-opened').textContent = stats.tabsOpened;
    document.getElementById('most-visited').textContent = stats.mostVisited;
    document.getElementById('time-browsing').textContent = formatTimeStat(stats.timeBrowsing);
    document.getElementById('productivity-score').textContent = `${stats.productivityScore}%`;
  });
}

function formatTimeStat(minutes) {
  if (!minutes) return '0m';
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}