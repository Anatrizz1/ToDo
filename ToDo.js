const SUPABASE_URL = "https://iifxubtzifbqupsaczam.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-qhs5DK1r2XbWE1rt1yiqg_7dVX-eYS";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');
const filters = document.querySelectorAll('.filters__button');

// A lista começa vazia
let tasks = [];
let currentFilter = 'all';

// BUSCAR TAREFAS 

async function loadTasks() {
    const { data, error } = await db
        .from('todos')
        .select('*')
        .order('created_at', { ascending: true }); // Ordena da mais antiga para a mais nova

    if (error) {
        console.error('Erro ao buscar tarefas:', error.message);
        return;
    }

    tasks = data; // Coloca os dados do banco na nossa variável
    renderTasks();
}


// RENDERIZAR NA TELA
function renderTasks() {
    taskList.innerHTML = ''; 

    const filteredTasks = tasks.filter(task => {
        // Agora usamos 'is_completed' em vez de 'completed' para bater com o banco
        if (currentFilter === 'active') {
            return !task.is_completed;
        } else if (currentFilter === 'completed') {
            return task.is_completed;
        }
        return true;
    });

    filteredTasks.forEach((task) => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        if (task.is_completed) {
            li.classList.add('completed');
        }
        // Agora usamos 'task.title' em vez de 'task.text'
        li.innerHTML = `
            <label>
                <input type="checkbox" ${task.is_completed ? 'checked' : ''} data-id="${task.id}">
                <span>${task.title}</span>
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

// 3. ADICIONAR TAREFA (CREATE)

async function addTask() {
    const title = taskInput.value.trim();
    if (title !== '') {
        taskInput.value = ''; // Limpa o input rápido para boa UX

        // Insere a tarefa no banco e pede os dados de volta (.select)
        const { data, error } = await db
            .from('todos')
            .insert([{ title: title, is_completed: false }])
            .select();

        if (error) {
            console.error('Erro ao salvar no banco:', error.message);
            return;
        }

        // Adiciona a tarefa (com o ID gerado pelo banco) na lista e renderiza
        tasks.push(data[0]);
        renderTasks();
    }
}

// MARCAR COMO CONCLUÍDO (UPDATE)
async function toggleTask(event) {
    if (event.target.closest('label')) {
        const input = event.target.closest('label').querySelector('input');
        const taskId = input.dataset.id;
        const indexReal = tasks.findIndex(task => String(task.id) === String(taskId));

        if (indexReal !== -1) {
            // Inverte o valor
            const novoStatus = !tasks[indexReal].is_completed;
            
            // Atualiza na tela primeiro para ficar mais rápido pro usuário
            tasks[indexReal].is_completed = novoStatus;
            renderTasks();

            // Atualiza no banco de dados
            const { error } = await db
                .from('todos')
                .update({ is_completed: novoStatus })
                .eq('id', taskId);

            if (error) {
                console.error('Erro ao atualizar status:', error.message);
                // Se der erro no banco, desfazemos a ação na tela
                tasks[indexReal].is_completed = !novoStatus;
                renderTasks();
            }
        }
    }
}

// DELETAR TAREFA (DELETE)
async function deleteTask(event) {
    if (event.target.closest('.delete-button')) {
        const button = event.target.closest('.delete-button');
        const li = button.closest('li');
        const taskId = button.dataset.id;
        const indexReal = tasks.findIndex(task => String(task.id) === String(taskId));

        if (indexReal !== -1) {
            li.classList.add('slide-out');

            // Deleta do banco de dados
            const { error } = await db
                .from('todos')
                .delete()
                .eq('id', taskId);

            if (error) {
                console.error('Erro ao deletar do banco:', error.message);
                li.classList.remove('slide-out');
                return;
            }

            setTimeout(() => {
                tasks.splice(indexReal, 1);
                renderTasks();
            }, 400); 
        }
    }
}

// CONFIGURAÇÃO DOS FILTROS E EVENTOS
filters.forEach(button => {
    button.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderTasks();  
    });
});

document.addEventListener('DOMContentLoaded', loadTasks);

taskList.addEventListener('click', toggleTask);
taskList.addEventListener('click', deleteTask);

addTaskButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});