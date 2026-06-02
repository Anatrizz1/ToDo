// ==========================================
// CONFIGURAÇÃO DO BANCO (SUPABASE)
// ==========================================
// Chave pública e URL do meu projeto. Como é o front-end, uso a anon key.
const SUPABASE_URL = "https://iifxubtzifbqupsaczam.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-qhs5DK1r2XbWE1rt1yiqg_7dVX-eYS";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// MAPEAMENTO DO DOM 
// ==========================================
// Elementos da To-Do List
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');
const filters = document.querySelectorAll('.filters__button');

// Elementos de Autenticação e Layout
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

// Estado global do meu app
let tasks = [];
let currentFilter = 'all';
let sessionUser = null;

// ==========================================
// MONITOR DE SESSÃO E MUDANÇA DE LAYOUT
// ==========================================
// Fica escutando se o usuário logou ou deslogou para trocar a tela
db.auth.onAuthStateChange((event, session) => {
    if (session) {
        sessionUser = session.user;
        
        // Troca do modo "Split Screen" para o modo "App Centralizado"
        mainContainer.classList.remove('login-layout');
        mainContainer.classList.add('app-layout');
        
        authContainer.style.display = 'none';
        todoAppContainer.style.display = 'block';
        userGreeting.innerText = `Logado como: ${sessionUser.email}`;
        
        // Puxa as tarefas exclusivas desse usuário assim que ele loga
        loadTasks(); 
    } else {
        sessionUser = null;
        tasks = []; // Limpo o estado da tela por segurança
        renderTasks();
        
        // Volta para o modo "Split Screen" da tela de login
        mainContainer.classList.remove('app-layout');
        mainContainer.classList.add('login-layout');
        
        authContainer.style.display = 'block';
        todoAppContainer.style.display = 'none';
    }
});

// ==========================================
//  FUNÇÕES DE AUTENTICAÇÃO
// ==========================================
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
//  CRUD COM O BANCO DE DADOS (SUPABASE)
// ==========================================

// READ: Busca as tarefas cadastradas no banco
async function loadTasks() {
    if (!sessionUser) return; // Trava de segurança: só busca se tiver logado
    
    const { data, error } = await db
        .from('todos')
        .select('*')
        .eq('user_id', sessionUser.id) // Filtra pelo ID do usuário atual
        .order('created_at', { ascending: true }); // Mais antigas primeiro

    if (error) {
        console.error('Erro ao buscar tarefas:', error.message);
        return;
    }
    tasks = data;
    renderTasks();
}

// RENDER: Atualiza a lista na tela com base nos filtros
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
        
        // Estrutura da "pílula" da tarefa usando SVG inline para a lixeira
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

// CREATE: Salva uma nova tarefa
async function addTask() {
    const title = taskInput.value.trim();
    if (title !== '' && sessionUser) {
        taskInput.value = ''; // UX: limpa o input na hora para o usuário não esperar
        
        const { data, error } = await db
            .from('todos')
            .insert([{ title: title, is_completed: false, user_id: sessionUser.id }])
            .select();

        if (error) {
            console.error('Erro ao salvar no banco:', error.message);
            return;
        }
        
        // Pego o retorno do banco (que já vem com o ID oficial gerado) e coloco na tela
        tasks.push(data[0]);
        renderTasks();
    }
}

// UPDATE: Marca ou desmarca a tarefa como concluída
async function toggleTask(event) {
    if (event.target.closest('label')) {
        const input = event.target.closest('label').querySelector('input');
        const taskId = input.dataset.id;
        const indexReal = tasks.findIndex(task => String(task.id) === String(taskId));

        if (indexReal !== -1) {
            const novoStatus = !tasks[indexReal].is_completed;
            
            // Optimistic UI: atualizo a tela na mesma hora para parecer rápido
            tasks[indexReal].is_completed = novoStatus;
            renderTasks(); 

            // Depois mando a requisição pro banco atualizar a coluna is_completed
            const { error } = await db
                .from('todos')
                .update({ is_completed: novoStatus })
                .eq('id', taskId);

            if (error) {
                console.error('Erro ao atualizar no banco:', error.message);
                // Se der erro no banco, eu desfaço a alteração visual
                tasks[indexReal].is_completed = !novoStatus; 
                renderTasks();
            }
        }
    }
}

// DELETE: Exclui a tarefa do banco e da tela
async function deleteTask(event) {
    if (event.target.closest('.delete-button')) {
        const button = event.target.closest('.delete-button');
        const li = button.closest('li');
        const taskId = button.dataset.id;
        const indexReal = tasks.findIndex(task => String(task.id) === String(taskId));

        if (indexReal !== -1) {
            li.classList.add('slide-out'); // Aciono a animação CSS antes de excluir
            
            const { error } = await db
                .from('todos')
                .delete()
                .eq('id', taskId);

            if (error) {
                console.error('Erro ao deletar no banco:', error.message);
                li.classList.remove('slide-out');
                return;
            }

            // Só tiro do DOM e do Array depois que a animação de slide-out terminar (400ms)
            setTimeout(() => {
                tasks.splice(indexReal, 1);
                renderTasks();
            }, 400); 
        }
    }
}

// ==========================================
// 5. EVENT LISTENERS
// ==========================================
// Controle de botões de filtro (Todas, Pendentes, Concluídas)
filters.forEach(button => {
    button.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderTasks();  
    });
});

// Delegação de eventos na lista para performance (pegando cliques no check e na lixeira)
taskList.addEventListener('click', toggleTask);
taskList.addEventListener('click', deleteTask);

// Acionando a criação de tarefa pelo botão e pela tecla Enter
addTaskButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});