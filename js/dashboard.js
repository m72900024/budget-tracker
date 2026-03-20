/**
 * dashboard.js - 面板渲染 + 圓餅圖 + 年度篩選 + 搜尋
 */

// ===== 圓餅圖 =====
function drawPie() {
  const canvas = document.getElementById('pie-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 180, cx = size/2, cy = size/2, r = 70;
  ctx.clearRect(0, 0, size, size);

  const slices = [];
  BT.data.projects.forEach(p => {
    const c = calcProj(p);
    if (c.budget > 0) slices.push({ name: p.name, value: c.budget, used: c.used });
  });

  if (slices.length === 0) {
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#9ca3af'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('尚無資料', cx, cy+5);
    return;
  }

  const total = slices.reduce((s,d) => s+d.value, 0);
  const colors = ['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'];
  let angle = -Math.PI/2;

  slices.forEach((s, i) => {
    const sweep = (s.value/total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle+sweep); ctx.closePath();
    ctx.fillStyle = colors[i % colors.length]; ctx.fill();
    if (sweep > 0.3) {
      const mid = angle + sweep/2;
      const lx = cx + Math.cos(mid) * (r * 0.65);
      const ly = cy + Math.sin(mid) * (r * 0.65);
      ctx.fillStyle = 'white'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(Math.round(s.value/total*100)+'%', lx, ly+4);
    }
    angle += sweep;
  });
}

// ===== 年度篩選 =====
function renderYearTags() {
  const years = [...new Set(BT.data.projects.map(p => p.year).filter(y => y))];
  const container = document.getElementById('year-tags');
  if (!container) return;
  container.innerHTML = '';
  if (years.length === 0) return;

  const allBtn = document.createElement('button');
  allBtn.className = `px-3 py-1 rounded-full text-xs font-bold transition ${!BT.yearFilter ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300'}`;
  allBtn.textContent = '全部';
  allBtn.onclick = () => { BT.yearFilter = ''; renderDashboard(); };
  container.appendChild(allBtn);

  years.sort().forEach(y => {
    const btn = document.createElement('button');
    btn.className = `px-3 py-1 rounded-full text-xs font-bold transition ${BT.yearFilter===y ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300'}`;
    btn.textContent = y;
    btn.onclick = () => { BT.yearFilter = y; renderDashboard(); };
    container.appendChild(btn);
  });
}

// ===== 面板渲染 =====
function renderDashboard() {
  const all = calcAll();
  document.getElementById('stat-projects').textContent = BT.data.projects.length;
  document.getElementById('stat-budget').textContent = '$' + fmt(all.budget);
  document.getElementById('stat-used').textContent = '$' + fmt(all.used);
  document.getElementById('stat-remain').textContent = '$' + fmt(all.remain);

  renderYearTags();
  drawPie();

  const container = document.getElementById('project-cards');
  container.innerHTML = '';
  const search = (document.getElementById('dashboard-search')?.value || '').toLowerCase();
  const filtered = BT.data.projects.filter(p => {
    if (search && !p.name.toLowerCase().includes(search) && !(p.desc||'').toLowerCase().includes(search)) return false;
    if (BT.yearFilter && p.year !== BT.yearFilter) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = BT.data.projects.length === 0
      ? '<div class="col-span-full text-center py-12 text-gray-400"><p class="text-5xl mb-4">📋</p><p class="text-lg">尚無計畫，點擊下方按鈕新增</p></div>'
      : '<div class="col-span-full text-center py-8 text-gray-400"><p class="text-lg">找不到符合的計畫</p></div>';
    return;
  }

  filtered.forEach(proj => {
    const c = calcProj(proj);
    const catCount = proj.categories.length;
    const expCount = proj.categories.reduce((s, cat) => s + cat.expenses.length, 0);
    let approvedAmt = 0, pendingAmt = 0;
    proj.categories.forEach(cat => cat.expenses.forEach(e => {
      if (e.status === 'approved') approvedAmt += (e.amount||0);
      else pendingAmt += (e.amount||0);
    }));
    const progressColor = c.percent > 90 ? 'bg-danger' : c.percent > 70 ? 'bg-warning' : 'bg-primary';

    let deadlineHtml = '';
    if (proj.deadline) {
      const today = new Date(); today.setHours(0,0,0,0);
      const dl = new Date(proj.deadline + "T00:00:00");
      const days = Math.ceil((dl - today) / (1000*60*60*24));
      if (days < 0) deadlineHtml = `<span class="text-xs text-danger font-bold">⚠️ 已逾期 ${-days} 天</span>`;
      else if (days <= 30) deadlineHtml = `<span class="text-xs text-warning font-bold">⏰ 剩 ${days} 天結案</span>`;
      else deadlineHtml = `<span class="text-xs text-gray-400">📅 ${proj.deadline}</span>`;
    }

    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 p-6 rounded-xl card-shadow hover:shadow-lg transition cursor-pointer transform hover:scale-[1.02]';
    card.onclick = () => openProject(proj.id);
    card.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div>
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">${escapeHtml(proj.name)}</h3>
          ${proj.year ? `<span class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">${escapeHtml(proj.year)}</span>` : ''}
        </div>
        <span class="text-xs px-2 py-1 rounded-full ${c.percent>90?'bg-red-100 text-danger':c.percent>70?'bg-yellow-100 text-warning':'bg-green-100 text-secondary'} font-bold">${c.percent}%</span>
      </div>
      ${proj.desc ? `<p class="text-sm text-gray-500 dark:text-gray-400 mb-1">${escapeHtml(proj.desc)}</p>` : ''}
      ${deadlineHtml ? `<div class="mb-2">${deadlineHtml}</div>` : ''}
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
        <div class="progress-bar ${progressColor} rounded-full h-3" role="progressbar" aria-valuenow="${c.percent}" aria-valuemin="0" aria-valuemax="100" style="width:${Math.min(c.percent,100)}%"></div>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center text-sm">
        <div><p class="text-gray-400">預算</p><p class="font-bold text-gray-800 dark:text-white">$${fmt(c.budget)}</p></div>
        <div><p class="text-gray-400">已用</p><p class="font-bold text-warning">$${fmt(c.used)}</p></div>
        <div><p class="text-gray-400">剩餘</p><p class="font-bold ${c.remain<0?'text-danger':'text-secondary'}">$${fmt(c.remain)}</p></div>
      </div>
      <div class="mt-3 pt-3 border-t dark:border-gray-700 flex justify-between text-xs text-gray-400">
        <span>${catCount} 個類別 · ${expCount} 筆</span>
        <span>✅$${fmt(approvedAmt)} · ⏳$${fmt(pendingAmt)}</span>
      </div>`;
    container.appendChild(card);
  });
}

// ===== 面板 ↔ 詳情切換 =====
function openProject(id) {
  BT.currentProjectId = id;
  document.getElementById('dashboard-view').classList.add('hidden');
  document.getElementById('detail-view').classList.remove('hidden');
  renderDetail();
}

function backToDashboard() {
  BT.currentProjectId = null;
  document.getElementById('detail-view').classList.add('hidden');
  document.getElementById('dashboard-view').classList.remove('hidden');
  renderDashboard();
}

// ===== 計畫 Modal =====
function showAddProjectModal() {
  BT.editingProjectId = null;
  document.getElementById('modal-project-title').textContent = '新增計畫';
  ['inp-project-name','inp-project-desc','inp-project-year','inp-project-deadline'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('modal-project').classList.add('open');
  document.getElementById('inp-project-name').focus();
}

window.editCurrentProject = function() {
  const p = getProject(); if (!p) return;
  BT.editingProjectId = p.id;
  document.getElementById('modal-project-title').textContent = '編輯計畫';
  document.getElementById('inp-project-name').value = p.name;
  document.getElementById('inp-project-desc').value = p.desc || '';
  document.getElementById('inp-project-year').value = p.year || '';
  document.getElementById('inp-project-deadline').value = p.deadline || '';
  document.getElementById('modal-project').classList.add('open');
};

window.saveProject = function() {
  const name = document.getElementById('inp-project-name').value.trim();
  if (!name) return toast('請輸入計畫名稱', 'error');
  const desc = document.getElementById('inp-project-desc').value.trim();
  const year = document.getElementById('inp-project-year').value.trim();
  const deadline = document.getElementById('inp-project-deadline').value;
  if (BT.editingProjectId) {
    const p = getProject(BT.editingProjectId);
    if (p) Object.assign(p, { name, desc, year, deadline });
    toast('計畫已更新');
  } else {
    BT.data.projects.push({ id: uid(), name, desc, year, deadline, categories: [] });
    toast('計畫已建立');
  }
  BT.save(); closeAllModals();
  if (BT.currentProjectId) renderDetail();
  renderDashboard();
};

window.deleteCurrentProject = function() {
  if (!confirm('確定刪除此計畫？所有經費和核銷紀錄都會刪除！')) return;
  BT.data.projects = BT.data.projects.filter(p => p.id !== BT.currentProjectId);
  BT.save(); toast('計畫已刪除', 'warning'); backToDashboard();
};
