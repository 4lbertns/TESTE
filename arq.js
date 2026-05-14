// --- CONFIGURAÇÃO INICIAL E LOGIN ---
const USER_EMAIL = "admin@email.com";
const USER_PASS = "senha123";

// DOM Elements
const app = document.getElementById('app-section');
const login = document.getElementById('login-section');

// --- SISTEMA DE TEMA (DARK/LIGHT) ---
const themeToggleBtn = document.getElementById('theme-toggle');
const rootElement = document.documentElement;
let currentTheme = localStorage.getItem('nexusTheme') || 'dark';
rootElement.setAttribute('data-theme', currentTheme);
updateThemeIcon();

themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    rootElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('nexusTheme', currentTheme);
    updateThemeIcon();
    renderCharts(); // Atualiza cores dos gráficos
});

function updateThemeIcon() {
    themeToggleBtn.innerHTML = currentTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

// --- NOTIFICAÇÕES TOAST ---
function showToast(msg, type = 'primary') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    let borderColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    toast.style.borderLeftColor = borderColor;
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- AUTENTICAÇÃO ---
if (sessionStorage.getItem('nexusAuth') === 'true') initApp();

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.getElementById('email').value === USER_EMAIL && document.getElementById('password').value === USER_PASS) {
        sessionStorage.setItem('nexusAuth', 'true');
        initApp();
    } else {
        showToast('<i class="fa-solid fa-circle-xmark"></i> Credenciais incorretas', 'error');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('nexusAuth');
    location.reload();
});

// --- LÓGICA CORE DO DASHBOARD ---
let transactions = JSON.parse(localStorage.getItem('nexusProData')) || [];
let doughnutChart, barChart;

// Configuração de Metas Estáticas do Usuário
const userGoals = [
    { id: 1, name: "Mudança para Natal/RN", target: 4500, current: 1200, color: "#3b82f6" },
    { id: 2, name: "Suplementação Mensal", target: 400, current: 150, color: "#10b981" }
];

function initApp() {
    login.classList.add('hidden');
    app.classList.remove('hidden');
    
    // Data atual
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('date').valueAsDate = new Date();
    
    populateMonthFilter();
    renderGoals();
    updateDashboard();
}

// Event Listeners
document.getElementById('add-btn').addEventListener('click', addTransaction);
document.getElementById('filter-text').addEventListener('input', updateDashboard);
document.getElementById('filter-month').addEventListener('change', updateDashboard);

function addTransaction() {
    const desc = document.getElementById('desc').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    if (!desc || isNaN(amount) || !date) return showToast('Preencha os dados corretamente', 'error');

    transactions.push({ id: Date.now(), desc, amount, type, category, date });
    localStorage.setItem('nexusProData', JSON.stringify(transactions));
    
    document.getElementById('desc').value = '';
    document.getElementById('amount').value = '';
    
    showToast('<i class="fa-solid fa-check"></i> Registro salvo com sucesso!', 'success');
    updateDashboard();
}

window.deleteTransaction = function(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('nexusProData', JSON.stringify(transactions));
    updateDashboard();
};

function formatCurrency(val) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- FILTROS E ATUALIZAÇÃO DA UI ---
function populateMonthFilter() {
    const select = document.getElementById('filter-month');
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort().reverse();
    
    months.forEach(month => {
        const [y, m] = month.split('-');
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${m}/${y}`;
        select.appendChild(option);
    });
}

function updateDashboard() {
    const filterText = document.getElementById('filter-text').value.toLowerCase();
    const filterMonth = document.getElementById('filter-month').value;

    let filtered = transactions.filter(t => {
        const matchText = t.desc.toLowerCase().includes(filterText) || t.category.toLowerCase().includes(filterText);
        const matchMonth = filterMonth === 'all' || t.date.startsWith(filterMonth);
        return matchText && matchMonth;
    });

    // Ordenar por data mais recente
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderTable(filtered);
    updateKPIs(filtered);
    renderCharts(filtered);
}

function renderTable(data) {
    const tbody = document.getElementById('transaction-list');
    tbody.innerHTML = '';
    
    data.forEach(t => {
        const isIncome = t.type === 'income';
        const dateStr = t.date.split('-').reverse().join('/');
        const icon = isIncome ? 'fa-arrow-up' : 'fa-arrow-down';
        
        tbody.innerHTML += `
            <tr>
                <td>${dateStr}</td>
                <td style="font-weight: 500;">${t.desc}</td>
                <td><span class="text-muted">${t.category}</span></td>
                <td>
                    <span class="badge ${t.type}">
                        <i class="fa-solid ${icon}"></i> ${formatCurrency(t.amount)}
                    </span>
                </td>
                <td>
                    <button class="btn-delete" onclick="deleteTransaction(${t.id})">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function updateKPIs(data) {
    let income = 0, expense = 0;
    data.forEach(t => t.type === 'income' ? income += t.amount : expense += t.amount);
    
    document.getElementById('total-income').textContent = formatCurrency(income);
    document.getElementById('total-expense').textContent = formatCurrency(expense);
    document.getElementById('total-balance').textContent = formatCurrency(income - expense);
}

// --- RENDERIZAÇÃO DE GRÁFICOS E METAS ---
function renderGoals() {
    const container = document.getElementById('goals-container');
    container.innerHTML = '';
    
    userGoals.forEach(goal => {
        const percent = Math.min((goal.current / goal.target) * 100, 100).toFixed(1);
        container.innerHTML += `
            <div class="goal-item">
                <div class="goal-info">
                    <span>${goal.name}</span>
                    <span>${percent}% (${formatCurrency(goal.current)})</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-fill" style="width: ${percent}%; background-color: ${goal.color};"></div>
                </div>
            </div>
        `;
    });
}

function renderCharts(data = transactions) {
    const textCol = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    const gridCol = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

    // Dados para Gráfico de Rosca (Categorias de Despesa)
    const expData = data.filter(t => t.type === 'expense');
    const categories = {};
    expData.forEach(t => categories[t.category] = (categories[t.category] || 0) + t.amount);

    if (doughnutChart) doughnutChart.destroy();
    doughnutChart = new Chart(document.getElementById('doughnutChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories).length ? Object.keys(categories) : ['Sem dados'],
            datasets: [{
                data: Object.values(categories).length ? Object.values(categories) : [1],
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#a855f7'],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: textCol } } } }
    });

    // Dados para Gráfico de Barras (Fluxo dos últimos meses)
    const monthlyData = {};
    data.forEach(t => {
        const m = t.date.substring(0, 7);
        if(!monthlyData[m]) monthlyData[m] = { income: 0, expense: 0 };
        t.type === 'income' ? monthlyData[m].income += t.amount : monthlyData[m].expense += t.amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort().slice(-6); // Últimos 6 meses
    
    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: sortedMonths.length ? sortedMonths : ['Mês Atual'],
            datasets: [
                { label: 'Receitas', data: sortedMonths.map(m => monthlyData[m].income), backgroundColor: '#10b981', borderRadius: 4 },
                { label: 'Despesas', data: sortedMonths.map(m => monthlyData[m].expense), backgroundColor: '#ef4444', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { grid: { color: gridCol }, ticks: { color: textCol } },
                x: { grid: { display: false }, ticks: { color: textCol } }
            },
            plugins: { legend: { labels: { color: textCol } } }
        }
    });
}

// Ações Auxiliares
document.getElementById('clear-data').addEventListener('click', () => {
    if(confirm('Aviso: Isso apagará todas as transações permanentemente.')) {
        localStorage.removeItem('nexusProData');
        transactions = [];
        updateDashboard();
        showToast('Sistema resetado', 'error');
    }
});
