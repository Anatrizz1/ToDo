const SUPABASE_URL = "https://iifxubtzifbqupsaczam.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-qhs5DK1r2XbWE1rt1yiqg_7dVX-eYS";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 1. ELEMENTOS DA TELA
// ==========================================
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');
const filters = document.querySelectorAll('.filters__button');

const authContainer = document.getElementById('authContainer');
const todoAppContainer = document.getElementById('todoAppContainer');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const logoutButton = document.getElementById('logoutButton');
const authMessage = document.getElementById('authMessage');
const userGreeting = document.getElementById('userGreeting');
const mainContainer = document.getElementById('mainContainer');
let tasks = [];
let currentFilter = 'all';
let sessionUser = null;

db.auth.onAuthStateChange((event, session) => {
    if (session) {
        sessionUser = session.user;
        
        // --- ADICIONE ESTAS DUAS LINHAS ---
        mainContainer.classList.remove('login-layout');
        mainContainer.classList.add('app-layout');
        
        authContainer.style.display = 'none';
        todoAppContainer.style.display = 'block';
        userGreeting.innerText = `Logado como: ${sessionUser.email}`;
        loadTasks(); 
    } else {
        sessionUser = null;
        tasks = []; 
        renderTasks();
        
        // --- ADICIONE ESTAS DUAS LINHAS ---
        mainContainer.classList.remove('app-layout');
        mainContainer.classList.add('login-layout');
        
        authContainer.style.display = 'block';
        todoAppContainer.style.display = 'none';
    }
});

// ==========================================
// 2. MONITOR DE SESSÃO E LOGIN
// ==========================================
db.auth.onAuthStateChange((event, session) => {
    if (session) {
        sessionUser = session.user;
        authContainer.style.display = 'none';
        todoAppContainer.style.display = 'block';
        userGreeting.innerText = `Logado como: ${sessionUser.email}`;
        loadTasks(); // Puxa as tarefas quando loga
    } else {
        sessionUser = null;
        tasks = []; // Limpa a lista da tela
        renderTasks();
        authContainer.style.display = 'block';
        todoAppContainer.style.display = 'none';
    }
});

registerButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authMessage.innerText = 'Criando conta...';
    const { error } = await db.auth.signUp({ email, password });
    if (error) authMessage.innerText = `Erro: ${error.message}`;
    else authMessage.innerText = 'Conta criada com sucesso! Pode entrar.';
});

loginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authMessage.innerText = 'Entrando...';
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) authMessage.innerText = 'Login falhou. Verifique os dados.';
    else authMessage.innerText = '';
});

logoutButton.addEventListener('click', async () => {
    await db.auth.signOut();
});

// ==========================================
// 3. COMUNICAÇÃO COM O BANCO DE DADOS
// ==========================================
async function loadTasks() {
    if (!sessionUser) return;
    const { data, error } = await db
        .from('todos')
        .select('*')
        .eq('user_id', sessionUser.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Erro ao buscar tarefas:', error.message);
        return;
    }
    tasks = data;
    renderTasks();
}

function renderTasks() {
    taskList.innerHTML = ''; 
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.is_completed;
        if (currentFilter === 'completed') return task.is_completed;
        return true;
    });

    filteredTasks.forEach((task) => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        if (task.is_completed) li.classList.add('completed');
        
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

async function addTask() {
    const title = taskInput.value.trim();
    if (title !== '' && sessionUser) {
        taskInput.value = ''; 
        const { data, error } = await db
            .from('todos')
            .insert([{ title: title, is_completed: false, user_id: sessionUser.id }])
            .select();

        if (error) {
            console.error('Erro ao salvar no banco:', error.message);
            return;
        }
        tasks.push(data[0]);
        renderTasks();
    }
}

async function toggleTask(event) {
    if (event.target.closest('label')) {
        const input = event.target.closest('label').querySelector('input');
        const taskId = input.dataset.id;
        const indexReal = tasks.findIndex(task => String(task.id) === String(taskId));

        if (indexReal !== -1) {
            const novoStatus = !tasks[indexReal].is_completed;
            tasks[indexReal].is_completed = novoStatus;
            renderTasks(); // Atualiza na tela rápido

            const { error } = await db
                .from('todos')
                .update({ is_completed: novoStatus })
                .eq('id', taskId);

            if (error) {
                console.error('Erro ao atualizar no banco:', error.message);
                tasks[indexReal].is_completed = !novoStatus; // Desfaz se der erro
                renderTasks();
            }
        }
    }
}

async function deleteTask(event) {
    if (event.target.closest('.delete-button')) {
        const button = event.target.closest('.delete-button');
        const li = button.closest('li');
        const taskId = button.dataset.id;
        const indexReal = tasks.findIndex(task => String(task.id) === String(taskId));

        if (indexReal !== -1) {
            li.classList.add('slide-out'); // Faz a animação
            
            const { error } = await db
                .from('todos')
                .delete()
                .eq('id', taskId);

            if (error) {
                console.error('Erro ao deletar no banco:', error.message);
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

// ==========================================
// 4. EVENTOS DE CLIQUE E TECLADO
// ==========================================
filters.forEach(button => {
    button.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderTasks();  
    });
});

taskList.addEventListener('click', toggleTask);
taskList.addEventListener('click', deleteTask);

addTaskButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});