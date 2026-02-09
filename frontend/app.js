const API_URL = "http://192.168.1.10:8000";

const form = document.getElementById("form");
const tableBody = document.querySelector("#table tbody");

const categoryCtx = document.getElementById("categoryChart");
const monthlyCtx = document.getElementById("monthlyChart");

let categoryChart = null;
let monthlyChart = null;

const filterStart = document.getElementById("filterStart");
const filterEnd = document.getElementById("filterEnd");
const filterCategorySelect = document.getElementById("filterCategory");
const applyFilter = document.getElementById("applyFilter");
const clearFilter = document.getElementById("clearFilter");
const addBtn = document.getElementById('addBtn');
const sidePanel = document.getElementById('sidePanel');
const closePanel = document.getElementById('closePanel');
const panelTitle = document.getElementById('panelTitle');
const overlay = document.getElementById('overlay');
const darkToggle = document.getElementById('darkToggle');

let transactionsData = [];  // almacena todas las transacciones
let currentPage = 1;
let itemsPerPage = 10;
let editingId = null;

// filtros actuales para mantener estado tras operaciones
let currentFilterStart = null;
let currentFilterEnd = null;
let currentFilterCategory = null;

// --------------------------------------------
// Evento: enviar formulario (form aparece primero en index.html)
// --------------------------------------------
form.addEventListener("submit", e => {
  e.preventDefault();

  const payload = {
    date: document.getElementById("date").value,
    amount: parseFloat(document.getElementById("amount").value),
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    description: document.getElementById("description").value
  };

  const submitBtn = form.querySelector('button[type="submit"]');

  if (editingId) {
    // Actualizar
    fetch(`${API_URL}/transactions/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al actualizar');
        form.reset();
        editingId = null;
        submitBtn.textContent = 'Guardar';
        closePanelFunc();
        loadTransactions(currentFilterStart, currentFilterEnd, currentFilterCategory);
      })
      .catch(err => console.error('PUT error', err));
  } else {
    // Crear
    fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(() => {
        form.reset();
        closePanelFunc();
        loadTransactions(currentFilterStart, currentFilterEnd, currentFilterCategory); // recargar
      })
      .catch(err => console.error('POST error', err));
  }
});

// --------------------------------------------
// Eventos de filtros (vienen justo después del form en index.html)
// --------------------------------------------
applyFilter.addEventListener("click", () => {
  const start = filterStart.value || null;
  const end = filterEnd.value || null;
  const category = filterCategorySelect.value || null;
  currentFilterStart = start;
  currentFilterEnd = end;
  currentFilterCategory = category;
  loadTransactions(start, end, category);
});

clearFilter.addEventListener("click", () => {
  filterStart.value = "";
  filterEnd.value = "";
  filterCategorySelect.value = "";
  currentFilterStart = null;
  currentFilterEnd = null;
  currentFilterCategory = null;
  loadTransactions();
});

// --------------------------------------------
// Función: actualizar tarjetas de resumen
// --------------------------------------------
function updateSummary(transactions) {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === "income") totalIncome += t.amount;
    else if (t.type === "expense") totalExpense += t.amount;
  });

  const balance = totalIncome - totalExpense;

  document.getElementById("totalIncome").textContent = `Ingresos: $${totalIncome.toFixed(2)}`;
  document.getElementById("totalExpense").textContent = `Gastos: $${totalExpense.toFixed(2)}`;
  document.getElementById("balance").textContent = `Balance: $${balance.toFixed(2)}`;
}

// traducir tipo
function translateType(type) {
  if (type === "income") return "Ingreso";
  if (type === "expense") return "Gasto";
  return type;
}


// --------------------------------------------
// Función: renderizar tabla (tabla y paginación están juntas en index.html)
// --------------------------------------------
function formatDateDisplay(isoDate) {
  // isoDate expected 'YYYY-MM-DD'
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const yy = parts[0].slice(2);
  return `${parts[2]}/${parts[1]}/${yy}`; // dd/mm/yy
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  } catch (e) {
    return amount.toFixed(2) + ' €';
  }
}

function renderTable(data) {
  tableBody.innerHTML = "";

  const totalPages = data.length === 0 ? 0 : Math.ceil(data.length / itemsPerPage);

  if (totalPages > 0 && currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = totalPages === 0 ? [] : data.slice(startIndex, endIndex);

  pageData.forEach(t => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDateDisplay(t.date)}</td>
      <td>${formatCurrency(t.amount)}</td>
      <td>${translateType(t.type)}</td>
      <td>${t.category}</td>
      <td>${t.description || ""}</td>
      <td>
        <button class="edit-btn" data-id="${t.id}">Editar</button>
        <button class="delete-btn" data-id="${t.id}">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Actualizar información de paginación y botones
  const paginationInfo = document.getElementById("pagination-info");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  if (totalPages === 0) {
    paginationInfo.textContent = `Página 0 de 0`;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } else {
    paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }
}

// cambiar items por página
document.getElementById("itemsPerPage").addEventListener("change", e => {
  itemsPerPage = parseInt(e.target.value) || 10;
  currentPage = 1;
  renderTable(transactionsData);
});

// botones de navegación
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable(transactionsData);
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  const totalPages = transactionsData.length === 0 ? 0 : Math.ceil(transactionsData.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable(transactionsData);
  }
});

// Delegación de eventos para botones Eliminar en la tabla
tableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;
  if (!confirm('¿Eliminar esta transacción?')) return;
  deleteTransaction(id);
});

function deleteTransaction(id) {
  fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('Error al eliminar');
      // recargar la lista actual (reinicia a página 1 por simplicidad)
      loadTransactions(currentFilterStart, currentFilterEnd, currentFilterCategory);
    })
    .catch(err => console.error('DELETE error', err));
}

// Delegación para Editar
tableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('.edit-btn');
  if (!btn) return;
  const id = btn.dataset.id && parseInt(btn.dataset.id, 10);
  if (!id) return;

  const tx = transactionsData.find(t => t.id === id);
  if (!tx) return;

  // rellenar formulario con datos de la transacción
  document.getElementById('date').value = tx.date;
  document.getElementById('amount').value = tx.amount;
  document.getElementById('type').value = tx.type;
  document.getElementById('category').value = tx.category;
  document.getElementById('description').value = tx.description || '';

  editingId = id;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Actualizar';
  panelTitle.textContent = 'Editar transacción';
  openPanel();
});

// Abrir/Cerrar panel lateral
function openPanel() {
  sidePanel.classList.add('open');
  sidePanel.setAttribute('aria-hidden', 'false');
  if (overlay) overlay.classList.add('open');
}

function closePanelFunc() {
  sidePanel.classList.remove('open');
  sidePanel.setAttribute('aria-hidden', 'true');
  // reset título y editing state
  panelTitle.textContent = 'Añadir transacción';
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Guardar';
  editingId = null;
  form.reset();
  if (overlay) overlay.classList.remove('open');
}

addBtn.addEventListener('click', () => {
  editingId = null;
  panelTitle.textContent = 'Añadir transacción';
  form.reset();
  openPanel();
});

closePanel.addEventListener('click', () => closePanelFunc());

// Cerrar panel al clicar el overlay
if (overlay) overlay.addEventListener('click', () => closePanelFunc());

// Cerrar panel con Escape
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanelFunc(); });

// -----------------------------
// Modo oscuro - persistencia
// -----------------------------
function applyDarkMode(enabled) {
  try {
    if (enabled) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    if (darkToggle) darkToggle.textContent = enabled ? '☀️' : '🌙';
  } catch (e) {}
}

// Inicializar desde localStorage
try {
  const saved = localStorage.getItem('darkMode');
  const enabled = saved === '1' || saved === 'true';
  applyDarkMode(enabled);
} catch(e) {}

if (darkToggle) {
  darkToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    try { localStorage.setItem('darkMode', isDark ? '1' : '0'); } catch(e) {}
    darkToggle.textContent = isDark ? '☀️' : '🌙';
  });
}

// --------------------------------------------
// Función: renderizar gráfico por categoría
// --------------------------------------------
function renderCategoryChart(data) {
  const expenses = data.filter(t => t.type === "expense");

  const totals = {};
  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(totals);
  const values = Object.values(totals);

  if (categoryChart) categoryChart.destroy();

  if (labels.length === 0) {
    categoryChart = null;
    return;
  }
  categoryChart = new Chart(categoryCtx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => `hsl(${i*50 % 360}, 70%, 60%)`)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });
  // Forzar redimensionado poco después para evitar que estilos inline
  // de canvas provoquen alturas extrañas en móviles
  setTimeout(() => { try { categoryChart && categoryChart.resize(); } catch(e) {} }, 80);
}

// --------------------------------------------
// Función: renderizar gráfico mensual
// --------------------------------------------
function renderMonthlyChart(data) {
  const monthly = {};

  data.forEach(t => {
    const month = t.date.slice(0, 7); // YYYY-MM
    if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };

    if (t.type === "income") monthly[month].income += t.amount;
    else monthly[month].expense += t.amount;
  });

  const labels = Object.keys(monthly).sort();
  if (labels.length === 0) {
    if (monthlyChart) { monthlyChart.destroy(); monthlyChart = null; }
    return;
  }

  const incomes = labels.map(m => monthly[m].income);
  const expenses = labels.map(m => monthly[m].expense);

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(monthlyCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "Ingresos", data: incomes, backgroundColor: "#4caf50" },
        { label: "Gastos", data: expenses, backgroundColor: "#f44336" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  });
  // Forzar resize para evitar problemas de render en móviles
  setTimeout(() => { try { monthlyChart && monthlyChart.resize(); } catch(e) {} }, 80);
}

// --------------------------------------------
// Función: cargar transacciones (opcionalmente filtradas)
// --------------------------------------------
function populateCategoryFilter(allData) {
  if (allData && Array.isArray(allData)) {
    const cats = Array.from(new Set(allData.map(t => t.category).filter(Boolean))).sort();
    filterCategorySelect.innerHTML = '<option value="">Todas</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      filterCategorySelect.appendChild(opt);
    });
    if (currentFilterCategory) filterCategorySelect.value = currentFilterCategory;
    return;
  }

  // fallback: fetch all
  fetch(`${API_URL}/transactions`).then(r => r.json()).then(all => populateCategoryFilter(all)).catch(() => {});
}

function loadTransactions(startDate = null, endDate = null, category = null) {
  fetch(`${API_URL}/transactions`)
    .then(res => res.json())
    .then(allData => {
      // Poblar filtro de categorías usando TODOS los registros
      populateCategoryFilter(allData);

      let data = Array.isArray(allData) ? allData.slice() : [];

      // Filtrar localmente por fechas y categoría
      if (startDate) data = data.filter(t => t.date >= startDate);
      if (endDate) data = data.filter(t => t.date <= endDate);
      if (category) data = data.filter(t => t.category === category);

      transactionsData = data;
      currentPage = 1; // reinicia a la primera página al recargar
      renderTable(transactionsData);
      renderCategoryChart(transactionsData);
      renderMonthlyChart(transactionsData);
      updateSummary(transactionsData);
    })
    .catch(err => console.error('GET error', err));
}

// --------------------------------------------
// Inicial
// --------------------------------------------
loadTransactions();
