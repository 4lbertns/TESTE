// ==========================================
// CONFIGURAÇÕES DE LOGIN (Mock Frontend)
// ==========================================
const USER_EMAIL = "admin@email.com";
const USER_PASS = "senha123";

// Elementos da DOM
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const addBtn = document.getElementById('add-btn');
const expenseList = document.getElementById('expense-list');
const totalAmountEl = document.getElementById('total-amount');

// Verifica se o usuário já está logado na sessão atual
if (sessionStorage.getItem('isLoggedIn') === 'true') {
    showApp();
}

// Lógica de Login
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email === USER_EMAIL && password === USER_PASS) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showApp();
    } else {
        loginError.textContent = "E-mail ou senha incorretos!";
    }
});

// Lógica de Logout
logoutBtn.addEventListener('click', function() {
    sessionStorage.removeItem('isLoggedIn');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    loginError.textContent = '';
    
    appSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

function showApp() {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    renderExpenses();
}

// ==========================================
// LÓGICA DA PLANILHA
// ==========================================

// Recupera dados do LocalStorage ou inicia um array vazio
let expenses = JSON.parse(localStorage.getItem('expensesData')) || [];

addBtn.addEventListener('click', function() {
    const dateInput = document.getElementById('exp-date').value;
    const descInput = document.getElementById('exp-desc').value;
    const amountInput = parseFloat(document.getElementById('exp-amount').value);

    if (!dateInput || !descInput || isNaN(amountInput)) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    const newExpense = {
        id: Date.now(),
        date: dateInput,
        desc: descInput,
        amount: amountInput
    };

    expenses.push(newExpense);
    saveData();
    renderExpenses();

    // Limpar campos
    document.getElementById('exp-date').value = '';
    document.getElementById('exp-desc').value = '';
    document.getElementById('exp-amount').value = '';
});

function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveData();
    renderExpenses();
}

function saveData() {
    localStorage.setItem('expensesData', JSON.stringify(expenses));
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString) {
    const parts = dateString.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function renderExpenses() {
    expenseList.innerHTML = '';
    let total = 0;

    expenses.forEach(expense => {
        total += expense.amount;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${expense.desc}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td><button class="delete-btn" onclick="deleteExpense(${expense.id})">Remover</button></td>
        `;
        expenseList.appendChild(tr);
    });

    totalAmountEl.textContent = formatCurrency(total);
}
