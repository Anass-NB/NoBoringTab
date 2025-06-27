// Todo List functionality for NoBoringTab

class TodoManager {
    constructor() {
        this.todos = [];
        this.todoInput = null;
        this.todoList = null;
        this.todoCounter = null;
        this.addButton = null;
        
        this.init();
    }

    async init() {
        // Get DOM elements
        this.todoInput = document.getElementById('todo-input');
        this.todoList = document.getElementById('todo-list');
        this.todoCounter = document.getElementById('todo-counter');
        this.addButton = document.getElementById('add-todo');

        // Load existing todos
        await this.loadTodos();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Render todos
        this.renderTodos();
    }

    setupEventListeners() {
        // Add todo on button click
        this.addButton?.addEventListener('click', () => {
            this.addTodo();
        });

        // Add todo on Enter key
        this.todoInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });

        // Auto-save on input blur
        this.todoInput?.addEventListener('blur', () => {
            this.saveTodos();
        });
    }

    async loadTodos() {
        try {
            // Try Chrome storage first
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get(['todoList']);
                this.todos = result.todoList || [];
            } else {
                // Fallback to localStorage
                const saved = localStorage.getItem('noboringtab_todoList');
                this.todos = saved ? JSON.parse(saved) : [];
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            this.todos = [];
        }
    }

    async saveTodos() {
        try {
            // Try Chrome storage first
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set({ todoList: this.todos });
            } else {
                // Fallback to localStorage
                localStorage.setItem('noboringtab_todoList', JSON.stringify(this.todos));
            }
        } catch (error) {
            console.error('Error saving todos:', error);
        }
    }

    addTodo() {
        const text = this.todoInput?.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            priority: 'normal' // normal, high, low
        };

        this.todos.unshift(todo);
        this.todoInput.value = '';
        
        this.renderTodos();
        this.saveTodos();
        
        // Show success notification
        this.showNotification('Task added successfully!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            
            this.renderTodos();
            this.saveTodos();
            
            const message = todo.completed ? 'Task completed! 🎉' : 'Task uncompleted';
            this.showNotification(message, todo.completed ? 'success' : 'info');
        }
    }

    deleteTodo(id) {
        const index = this.todos.findIndex(t => t.id === id);
        if (index !== -1) {
            this.todos.splice(index, 1);
            this.renderTodos();
            this.saveTodos();
            this.showNotification('Task deleted', 'info');
        }
    }

    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            todo.editedAt = new Date().toISOString();
            
            this.renderTodos();
            this.saveTodos();
            this.showNotification('Task updated', 'success');
        }
    }

    setPriority(id, priority) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.priority = priority;
            this.renderTodos();
            this.saveTodos();
        }
    }

    renderTodos() {
        if (!this.todoList || !this.todoCounter) return;

        // Clear existing todos
        this.todoList.innerHTML = '';

        // Sort todos: incomplete first, then by priority, then by creation date
        const sortedTodos = [...this.todos].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed - b.completed;
            }
            
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            if (a.priority !== b.priority) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Render each todo
        sortedTodos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            this.todoList.appendChild(todoElement);
        });

        // Update counter
        const completedCount = this.todos.filter(t => t.completed).length;
        const totalCount = this.todos.length;
        this.todoCounter.textContent = `${completedCount}/${totalCount} completed`;

        // Add empty state if no todos
        if (this.todos.length === 0) {
            this.todoList.innerHTML = `
                <div class="text-center text-sm opacity-60 py-8">
                    <i class="fas fa-clipboard-list text-2xl mb-2"></i>
                    <p>No tasks yet. Add one above!</p>
                </div>
            `;
        }
    }

    createTodoElement(todo) {
        const div = document.createElement('div');
        div.className = `todo-item flex items-center space-x-3 p-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200 ${todo.completed ? 'completed opacity-60' : ''}`;
        
        const priorityColor = {
            high: 'text-red-400',
            normal: 'text-blue-400',
            low: 'text-gray-400'
        };

        div.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                   class="w-4 h-4 text-blue-600 bg-white bg-opacity-20 border-white border-opacity-30 rounded focus:ring-blue-500" 
                   onchange="todoManager.toggleTodo('${todo.id}')">
            
            <div class="flex-1 min-w-0">
                <p class="todo-text text-sm ${todo.completed ? 'line-through' : ''}" 
                   ondblclick="todoManager.startEdit('${todo.id}')">${todo.text}</p>
                <div class="flex items-center space-x-2 mt-1 text-xs opacity-70">
                    <span class="${priorityColor[todo.priority]}">
                        <i class="fas fa-flag"></i> ${todo.priority}
                    </span>
                    <span>
                        <i class="fas fa-clock"></i> 
                        ${new Date(todo.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
            
            <div class="flex space-x-1">
                <button onclick="todoManager.showPriorityMenu('${todo.id}')" 
                        class="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200"
                        title="Set Priority">
                    <i class="fas fa-flag text-xs"></i>
                </button>
                <button onclick="todoManager.startEdit('${todo.id}')" 
                        class="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200"
                        title="Edit">
                    <i class="fas fa-edit text-xs"></i>
                </button>
                <button onclick="todoManager.deleteTodo('${todo.id}')" 
                        class="p-1 hover:bg-red-500 hover:bg-opacity-50 rounded transition-all duration-200"
                        title="Delete">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        `;

        return div;
    }

    startEdit(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const todoElement = document.querySelector(`[ondblclick*="${id}"]`);
        if (!todoElement) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = todo.text;
        input.className = 'flex-1 px-2 py-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 text-sm';
        
        input.addEventListener('blur', () => {
            this.editTodo(id, input.value);
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.editTodo(id, input.value);
            }
            if (e.key === 'Escape') {
                this.renderTodos();
            }
        });

        todoElement.replaceWith(input);
        input.focus();
        input.select();
    }

    showPriorityMenu(id) {
        // Remove existing priority menu
        const existingMenu = document.querySelector('.priority-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'priority-menu absolute z-50 mt-2 bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-lg shadow-lg';
        menu.innerHTML = `
            <div class="py-2">
                <button onclick="todoManager.setPriority('${id}', 'high'); this.parentElement.parentElement.remove();" 
                        class="w-full px-4 py-2 text-left hover:bg-white hover:bg-opacity-20 text-red-400 text-sm">
                    <i class="fas fa-flag mr-2"></i>High Priority
                </button>
                <button onclick="todoManager.setPriority('${id}', 'normal'); this.parentElement.parentElement.remove();" 
                        class="w-full px-4 py-2 text-left hover:bg-white hover:bg-opacity-20 text-blue-400 text-sm">
                    <i class="fas fa-flag mr-2"></i>Normal Priority
                </button>
                <button onclick="todoManager.setPriority('${id}', 'low'); this.parentElement.parentElement.remove();" 
                        class="w-full px-4 py-2 text-left hover:bg-white hover:bg-opacity-20 text-gray-400 text-sm">
                    <i class="fas fa-flag mr-2"></i>Low Priority
                </button>
            </div>
        `;

        // Position menu
        const todoElement = document.querySelector(`[onclick*="showPriorityMenu('${id}')"]`);
        if (todoElement) {
            const rect = todoElement.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = `${rect.bottom + 5}px`;
            menu.style.left = `${rect.left}px`;
            
            document.body.appendChild(menu);

            // Close menu when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target)) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 100);
        }
    }

    clearCompleted() {
        this.todos = this.todos.filter(todo => !todo.completed);
        this.renderTodos();
        this.saveTodos();
        this.showNotification('Completed tasks cleared', 'info');
    }

    getStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        const highPriority = this.todos.filter(t => t.priority === 'high' && !t.completed).length;
        
        return {
            total,
            completed,
            pending,
            highPriority,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    exportTodos() {
        const data = {
            todos: this.todos,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `noboringtab-todos-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Todos exported successfully!', 'success');
    }

    async importTodos(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.todos && Array.isArray(data.todos)) {
                this.todos = [...this.todos, ...data.todos];
                this.renderTodos();
                this.saveTodos();
                this.showNotification(`Imported ${data.todos.length} todos!`, 'success');
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            console.error('Error importing todos:', error);
            this.showNotification('Error importing todos. Please check the file format.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        if (window.Utils && window.Utils.Notification) {
            window.Utils.Notification.show(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize todo manager when DOM is loaded
let todoManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        todoManager = new TodoManager();
    });
} else {
    todoManager = new TodoManager();
}

// Export for global access
window.todoManager = todoManager;