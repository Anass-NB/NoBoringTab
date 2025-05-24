document.addEventListener('DOMContentLoaded', function () {
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

  // Initialize agenda
  loadAgendaItems();
  document.getElementById('add-agenda-item').addEventListener('click', showAgendaForm);
  document.getElementById('save-event').addEventListener('click', saveAgendaItem);
  document.getElementById('cancel-event').addEventListener('click', hideAgendaForm);

  // Initialize stats
  loadStats();
});

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
  chrome.storage.sync.get(['todos'], function (result) {
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
    emptyMessage.style.color = '#888';
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
    emptyMessage.style.color = '#888';
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

  chrome.storage.sync.get(['todos'], function (result) {
    const todos = result.todos || [];
    todos.push({
      text: todoText,
      completed: false,
      dueDate: todoDate || null,
      createdAt: new Date().toISOString()
    });

    chrome.storage.sync.set({ todos: todos }, function () {
      renderTodoList(todos);
      updateUpcomingDates(todos);
      hideTodoForm();
    });
  });
}

function toggleTodo(index) {
  chrome.storage.sync.get(['todos'], function (result) {
    const todos = result.todos || [];
    todos[index].completed = !todos[index].completed;

    chrome.storage.sync.set({ todos: todos }, function () {
      renderTodoList(todos);
      updateUpcomingDates(todos);
    });
  });
}

function deleteTodo(index) {
  chrome.storage.sync.get(['todos'], function (result) {
    const todos = result.todos || [];
    todos.splice(index, 1);

    chrome.storage.sync.set({ todos: todos }, function () {
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
      document.getElementById('quote-text').textContent = '"' + data.content + '"';
      document.getElementById('quote-author').textContent = '— ' + data.author;
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
      document.getElementById('quote-text').textContent = '"' + randomQuote.text + '"';
      document.getElementById('quote-author').textContent = '— ' + randomQuote.author;
    });
}

// Agenda Functions
function loadAgendaItems() {
  chrome.storage.sync.get(['agenda'], function (result) {
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
    emptyMessage.style.color = '#888';
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

  chrome.storage.sync.get(['agenda'], function (result) {
    const agendaItems = result.agenda || [];
    agendaItems.push({
      title: eventTitle,
      time: eventTime
    });

    chrome.storage.sync.set({ agenda: agendaItems }, function () {
      renderAgendaList(agendaItems);
      hideAgendaForm();
    });
  });
}

function deleteAgendaItem(index) {
  chrome.storage.sync.get(['agenda'], function (result) {
    const agendaItems = result.agenda || [];
    agendaItems.splice(index, 1);

    chrome.storage.sync.set({ agenda: agendaItems }, function () {
      renderAgendaList(agendaItems);
    });
  });
}

// Stats Functions
function loadStats() {
  chrome.storage.sync.get(['stats'], function (result) {
    const stats = result.stats || {
      tabsOpened: 0,
      mostVisited: '-',
      timeBrowsing: 0,
      productivityScore: 0
    };

    document.getElementById('tabs-opened').textContent = stats.tabsOpened;
    document.getElementById('most-visited').textContent = stats.mostVisited;
    document.getElementById('time-browsing').textContent = formatTime(stats.timeBrowsing);
    document.getElementById('productivity-score').textContent = `${stats.productivityScore}%`;
  });
}

function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}