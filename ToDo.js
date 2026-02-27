const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');
const filters = document.querySelectorAll('.filters__button');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

filters.forEach(button => {
    button.addEventListener('click', () => {
        filters.forEach(b=> b.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderTasks();  
    });
});
function renderTasks() {
    taskList.innerHTML = ''; 

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') {
            return !task.completed;
        } else if (currentFilter === 'completed') {
            return task.completed;
        }
        return true;
    });

    filteredTasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        if (task.completed) {
            li.classList.add('completed');
        }
        li.innerHTML = `
            <label>
                <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}" data-index="${index}">
                <span>${task.text}</span>
            </label>
            <button class="delete-button" data-id="${task.id}" aria-label="Excluir tarefa">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        `;
        taskList.appendChild(li);
    });
}

function addTask() {
        const text = taskInput.value.trim();
        if (text !== '') {
        const newTask = {
        id: Date.now(), 
        text: text,  
        completed: false 
    };
        tasks.push(newTask);
        taskInput.value = '';
        saveTasks();
        renderTasks();
    }
}

function toggleTask(event) {
    if (event.target.closest('label')) {
        const input = event.target.closest('label').querySelector('input');
        const indexReal = tasks.findIndex(task => task.id === parseInt(input.dataset.id));
        if (indexReal !== -1) {
        tasks[indexReal].completed = !tasks[indexReal].completed;
        saveTasks();
        renderTasks();
        }
    }
}

function deleteTask(event) {
    if (event.target.closest('.delete-button')) {
        const button = event.target.closest('.delete-button');
        const li = button.closest('li');
        const indexReal = tasks.findIndex(task => task.id === parseInt(button.dataset.id));
        li.classList.add('slide-out');
        setTimeout(() => {
            tasks.splice(indexReal, 1);
            saveTasks();
            renderTasks();
        }, 400); 
    }
}

// Função para salvar as tarefas no localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Adicionando os Event Listeners
document.addEventListener('DOMContentLoaded', renderTasks);

taskList.addEventListener('click', toggleTask);
taskList.addEventListener('click', deleteTask);

addTaskButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});