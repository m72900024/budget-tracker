/**
 * detail.js - 計畫詳情頁 + 類別 + 核銷項目 + 拖拉排序
 */

function renderDetail() {
  const proj = getProject();
  if (!proj) return backToDashboard();
  const c = calcProj(proj);
  document.getElementById('detail-title').textContent = proj.name;
  document.getElementById('detail-desc').textContent = proj.desc || '';

  // 期限
  const dlEl = document.getElementById('detail-deadline');
  if (proj.deadline) {
    const today = new Date(); today.setHours(0,0,0,0);
    const dl = new Date(proj.deadline + "T00:00:00");
    const days = Math.ceil((dl - today) / (1000*60*60*24));
    if (days < 0) dlEl.innerHTML = `<span class="text-danger font-bold">⚠️ 已逾期 ${-days} 天（期限：${proj.deadline}）</span>`;
    else if (days <= 30) dlEl.innerHTML = `<span class="text-warning font-bold">⏰ 剩 ${days} 天結案（期限：${proj.deadline}）</span>`;
    else dlEl.innerHTML = `<span class="text-gray-500">📅 結案期限：${proj.deadline}（剩 ${days} 天）</span>`;
  } else dlEl.textContent = '';

  document.getElementById('detail-used-label').textContent = `已用 $${fmt(c.used)} / $${fmt(c.budget)}`;
  document.getElementById('detail-remain-label').textContent = `剩餘 $${fmt(c.remain)} (${c.percent}%)`;
  document.getElementById('detail-progress').style.width = Math.min(c.percent, 100) + '%';
  document.getElementById('detail-progress').className = `progress-bar rounded-full h-4 ${c.percent>90?'bg-danger':c.percent>70?'bg-warning':'bg-primary'}`;

  const list = document.getElementById('categories-list');
  list.innerHTML = '';
  if (proj.categories.length === 0) {
    list.innerHTML = '<div class="text-center py-8 text-gray-400"><p class="text-lg">尚無經費類別</p></div>';
    return;
  }

  proj.categories.forEach((cat, catIdx) => {
    const cc = calcCat(cat);
    const pct = cc.budget > 0 ? Math.round(cc.used / cc.budget * 100) : 0;
    const progressColor = pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-secondary';
    const isCollapsed = BT.collapsedCats.has(cat.id);

    const div = document.createElement('div');
    div.className = 'bg-white dark:bg-gray-800 rounded-xl card-shadow overflow-hidden border-2 border-transparent';
    div.draggable = true;
    div.dataset.catId = cat.id;
    div.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', cat.id); div.classList.add('cat-dragging'); });
    div.addEventListener('dragend', () => div.classList.remove('cat-dragging'));
    div.addEventListener('dragover', e => { e.preventDefault(); div.classList.add('cat-drag-over'); });
    div.addEventListener('dragleave', () => div.classList.remove('cat-drag-over'));
    div.addEventListener('drop', e => {
      e.preventDefault(); div.classList.remove('cat-drag-over');
      const fromId = e.dataTransfer.getData('text/plain');
      if (fromId === cat.id) return;
      const proj = getProject();
      const fromIdx = proj.categories.findIndex(c => c.id === fromId);
      const toIdx = proj.categories.findIndex(c => c.id === cat.id);
      if (fromIdx < 0 || toIdx < 0) return;
      const [moved] = proj.categories.splice(fromIdx, 1);
      proj.categories.splice(toIdx, 0, moved);
      BT.save(); renderDetail();
      toast('類別順序已更新');
    });

    div.innerHTML = `
      <div class="p-5">
        <div class="flex justify-between items-center mb-2 cursor-pointer" onclick="toggleCat('${cat.id}')">
          <div class="flex items-center gap-2">
            <span class="text-gray-400 cursor-grab no-print" title="拖拉排序">⠿</span>
            <span class="text-sm transition-transform ${isCollapsed ? '' : 'rotate-90'}">${isCollapsed ? '▶' : '▼'}</span>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">${escapeHtml(cat.name)}</h3>
          </div>
          <div class="flex gap-2 items-center">
            <span class="text-sm font-bold ${cc.remain<0?'text-danger':'text-secondary'}">剩餘 $${fmt(cc.remain)} ${cc.remain<0?'⚠️超支！':''}</span>
            <button onclick="event.stopPropagation();editCategory('${cat.id}')" class="text-gray-400 hover:text-primary text-sm no-print">✏️</button>
            <button onclick="event.stopPropagation();deleteCategory('${cat.id}')" class="text-gray-400 hover:text-danger text-sm no-print">🗑️</button>
          </div>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mb-1">
          <span>$${fmt(cc.used)} / $${fmt(cc.budget)}</span>
          <span>${pct}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
          <div class="progress-bar ${progressColor} rounded-full h-2" style="width:${Math.min(pct,100)}%"></div>
        </div>
        <div class="${isCollapsed ? 'hidden' : ''}">
          <div class="space-y-2">
            ${cat.expenses.length === 0 ? '<p class="text-sm text-gray-400 text-center py-2">尚無核銷紀錄</p>' :
              [...cat.expenses].sort((a,b) => (b.date||'').localeCompare(a.date||'')).map(exp => {
                const st = statusMap[exp.status] || statusMap.pending;
                return `<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg group">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-medium text-gray-800 dark:text-white">${escapeHtml(exp.name)}</span>
                      <span class="px-2 py-0.5 text-xs rounded-full ${st.color} font-bold">${st.label}</span>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      ${escapeHtml(exp.date||'')} ${exp.vendor?'· 🏪'+escapeHtml(exp.vendor):''} ${exp.receipt?'· #'+escapeHtml(exp.receipt):''} ${exp.note?'· '+escapeHtml(exp.note):''}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-800 dark:text-white">$${fmt(exp.amount||0)}</span>
                    <div class="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity no-print">
                      <button onclick="event.stopPropagation();duplicateExpense('${cat.id}','${exp.id}')" class="text-gray-400 hover:text-blue-500 text-xs" title="複製">📋</button>
                      <button onclick="event.stopPropagation();editExpense('${cat.id}','${exp.id}')" class="text-gray-400 hover:text-primary text-xs">✏️</button>
                      <button onclick="event.stopPropagation();deleteExpense('${cat.id}','${exp.id}')" class="text-gray-400 hover:text-danger text-xs">🗑️</button>
                    </div>
                  </div>
                </div>`;
              }).join('')}
          </div>
          <button onclick="showAddExpenseModal('${cat.id}')" class="mt-3 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 hover:border-warning hover:text-warning transition text-sm font-bold no-print">＋ 新增核銷項目</button>
        </div>
      </div>`;
    list.appendChild(div);
  });
}

window.toggleCat = function(catId) {
  if (BT.collapsedCats.has(catId)) BT.collapsedCats.delete(catId);
  else BT.collapsedCats.add(catId);
  renderDetail();
};

// ===== 類別 Modal =====
function showAddCategoryModal() {
  BT.editingCategoryId = null;
  document.getElementById('modal-category-title').textContent = '新增經費類別';
  document.getElementById('inp-cat-name').value = '';
  document.getElementById('inp-cat-budget').value = '';
  document.getElementById('modal-category').classList.add('open');
  document.getElementById('inp-cat-name').focus();
}

window.editCategory = function(catId) {
  const p = getProject();
  const cat = p?.categories.find(c => c.id === catId);
  if (!cat) return;
  BT.editingCategoryId = catId;
  document.getElementById('modal-category-title').textContent = '編輯經費類別';
  document.getElementById('inp-cat-name').value = cat.name;
  document.getElementById('inp-cat-budget').value = cat.budget;
  document.getElementById('modal-category').classList.add('open');
};

window.saveCategory = function() {
  const name = document.getElementById('inp-cat-name').value.trim();
  const budget = parseFloat(document.getElementById('inp-cat-budget').value) || 0;
  if (!name) return toast('請輸入類別名稱', 'error');
  const p = getProject(); if (!p) return;
  if (BT.editingCategoryId) {
    const c = p.categories.find(c => c.id === BT.editingCategoryId);
    if (c) { c.name = name; c.budget = budget; }
    toast('類別已更新');
  } else {
    p.categories.push({ id: uid(), name, budget, expenses: [] });
    toast('類別已新增');
  }
  BT.save(); closeAllModals(); renderDetail();
};

window.deleteCategory = function(catId) {
  if (!confirm('確定刪除此類別？')) return;
  const p = getProject();
  if (p) {
    p.categories = p.categories.filter(c => c.id !== catId);
    BT.save(); renderDetail(); toast('類別已刪除', 'warning');
  }
};

// ===== 核銷 Modal =====
function showAddExpenseModal(catId) {
  BT.editingExpenseInfo = { catId, expId: null };
  document.getElementById('modal-expense-title').textContent = '新增核銷項目';
  document.getElementById('inp-exp-name').value = '';
  document.getElementById('inp-exp-amount').value = '';
  document.getElementById('inp-exp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('inp-exp-receipt').value = '';
  document.getElementById('inp-exp-status').value = 'pending';
  document.getElementById('inp-exp-note').value = '';
  refreshVendorDropdown();
  document.getElementById('inp-exp-vendor').value = '';
  document.getElementById('modal-expense').classList.add('open');
  document.getElementById('inp-exp-name').focus();
}

window.editExpense = function(catId, expId) {
  const p = getProject();
  const cat = p?.categories.find(c => c.id === catId);
  const exp = cat?.expenses.find(e => e.id === expId);
  if (!exp) return;
  BT.editingExpenseInfo = { catId, expId };
  document.getElementById('modal-expense-title').textContent = '編輯核銷項目';
  document.getElementById('inp-exp-name').value = exp.name;
  document.getElementById('inp-exp-amount').value = exp.amount;
  document.getElementById('inp-exp-date').value = exp.date || '';
  document.getElementById('inp-exp-receipt').value = exp.receipt || '';
  document.getElementById('inp-exp-status').value = exp.status || 'pending';
  document.getElementById('inp-exp-note').value = exp.note || '';
  refreshVendorDropdown();
  document.getElementById('inp-exp-vendor').value = exp.vendor || '';
  document.getElementById('modal-expense').classList.add('open');
};

window.duplicateExpense = function(catId, expId) {
  const p = getProject();
  const cat = p?.categories.find(c => c.id === catId);
  const exp = cat?.expenses.find(e => e.id === expId);
  if (!exp) return;
  const newExp = { ...exp, id: uid(), date: new Date().toISOString().split('T')[0], status: 'pending' };
  cat.expenses.push(newExp);
  BT.save(); renderDetail();
  toast(`已複製「${exp.name}」，狀態重設為待核銷`);
};

window.saveExpense = function() {
  const name = document.getElementById('inp-exp-name').value.trim();
  const amount = parseFloat(document.getElementById('inp-exp-amount').value) || 0;
  if (!name) return toast('請輸入項目名稱', 'error');
  if (isNaN(amount) || amount < 0) return toast('請輸入金額', 'error');
  const vendor = document.getElementById('inp-exp-vendor').value;
  const date = document.getElementById('inp-exp-date').value;
  const receipt = document.getElementById('inp-exp-receipt').value.trim();
  const status = document.getElementById('inp-exp-status').value;
  const note = document.getElementById('inp-exp-note').value.trim();
  const p = getProject();
  const cat = p?.categories.find(c => c.id === BT.editingExpenseInfo?.catId);
  if (!cat) return;
  if (BT.editingExpenseInfo.expId) {
    const e = cat.expenses.find(e => e.id === BT.editingExpenseInfo.expId);
    if (e) Object.assign(e, { name, amount, vendor, date, receipt, status, note });
    toast('核銷項目已更新');
  } else {
    cat.expenses.push({ id: uid(), name, amount, vendor, date, receipt, status, note });
    toast('核銷項目已新增');
  }
  BT.save(); closeAllModals(); renderDetail();
};

window.deleteExpense = function(catId, expId) {
  if (!confirm('確定刪除？')) return;
  const p = getProject();
  const cat = p?.categories.find(c => c.id === catId);
  if (cat) {
    cat.expenses = cat.expenses.filter(e => e.id !== expId);
    BT.save(); renderDetail(); toast('已刪除', 'warning');
  }
};
