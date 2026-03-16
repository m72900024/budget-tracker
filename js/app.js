/**
 * app.js - 啟動邏輯 + 全域事件 + 深色模式 + Toast + 工具函數
 */

window.BT = {
  data: { projects: [], vendors: [] },
  currentProjectId: null,
  editingProjectId: null,
  editingCategoryId: null,
  editingExpenseInfo: null,
  collapsedCats: new Set(),
  yearFilter: '',
  save: null  // 由 db.js 設定
};

// ===== 工具函數 =====
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function fmt(n) { return Number(n).toLocaleString('zh-TW', {minimumFractionDigits:0, maximumFractionDigits:1}); }

function calcCat(cat) {
  const u = cat.expenses.reduce((s,e) => s + (e.amount||0), 0);
  return { budget: cat.budget||0, used: u, remain: (cat.budget||0) - u };
}

function calcProj(proj) {
  let b=0, u=0;
  proj.categories.forEach(c => { const r=calcCat(c); b+=r.budget; u+=r.used; });
  return { budget:b, used:u, remain:b-u, percent: b>0 ? Math.round(u/b*100) : 0 };
}

function calcAll() {
  let b=0, u=0;
  BT.data.projects.forEach(p => { const c=calcProj(p); b+=c.budget; u+=c.used; });
  return { budget:b, used:u, remain:b-u };
}

function getProject(id) {
  return BT.data.projects.find(p => p.id === (id || BT.currentProjectId));
}

// ===== Toast =====
function toast(msg, type='success') {
  const c = document.getElementById('toast-container');
  const colors = { success:'bg-green-500', error:'bg-red-500', warning:'bg-yellow-500', info:'bg-blue-500' };
  const div = document.createElement('div');
  div.className = `toast ${colors[type]||colors.info} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-bold`;
  div.textContent = msg;
  c.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// ===== Modal =====
function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
}

// ===== 深色模式 =====
window.toggleDarkMode = function() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('dark-mode', document.documentElement.classList.contains('dark'));
  document.getElementById('dark-toggle').textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
};

function initDarkMode() {
  if (localStorage.getItem('dark-mode') === 'true') {
    document.documentElement.classList.add('dark');
  }
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
}

// ===== 快捷鍵 =====
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

// ===== 啟動 =====
BT.init = function() {
  initDarkMode();
  loadFromLocal();
  document.getElementById('app-container').classList.remove('hidden');
  renderDashboard();
};
