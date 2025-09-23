// 1. Selecionando os elementos HTML
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');

// 2. Array para armazenar as tarefas. Usamos localStorage.
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// 3. Função para renderizar as tarefas na tela
function renderTasks() {
    taskList.innerHTML = ''; 
    
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        if (task.completed) {
            li.classList.add('completed');
        }
        li.innerHTML = `
            <label>
                <input type="checkbox" ${task.completed ? 'checked' : ''} data-index="${index}">
                <span>${task.text}</span>
            </label>
            <button class="delete-button" data-index="${index}">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

// 4. Função para adicionar uma nova tarefa
function addTask() {
    const text = taskInput.value.trim();
    if (text !== '') {
        const newTask = {
            text,
            completed: false
        };
        tasks.push(newTask);
        taskInput.value = '';
        saveTasks();
        renderTasks();
    }
}

// 5. Função para marcar/desmarcar uma tarefa como completa
function toggleTask(event) {
    if (event.target.closest('label')) {
        const input = event.target.closest('label').querySelector('input');
        const index = input.dataset.index;
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }
}

// 6. Função para remover uma tarefa
function deleteTask(event) {
    if (event.target.closest('.delete-button')) {
        const button = event.target.closest('.delete-button');
        const li = button.closest('li');
        const index = button.dataset.index;
        li.classList.add('slide-out');
        setTimeout(() => {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }, 400); 
    }
}

// 7. Função para salvar as tarefas no localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 8. Adicionando os Event Listeners
document.addEventListener('DOMContentLoaded', renderTasks);

taskList.addEventListener('click', toggleTask);
taskList.addEventListener('click', deleteTask);

addTaskButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});