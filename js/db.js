/**
 * db.js - 純 localStorage 資料層
 */

function loadFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const d = JSON.parse(raw);
      BT.data.projects = d.projects || [];
      BT.data.vendors = d.vendors || [];
      BT.data.projects.forEach(p => {
        if (!p.year) p.year = '';
        if (!p.deadline) p.deadline = '';
      });
    } catch (e) {
      console.error('localStorage parse error:', e);
    }
  }
}

BT.save = function() {
  const payload = JSON.stringify({ projects: BT.data.projects, vendors: BT.data.vendors });
  localStorage.setItem(STORAGE_KEY, payload);
  // 自動備份：每日一份，最多保留 7 天
  const today = new Date().toISOString().split('T')[0];
  const backupKey = 'budget-tracker-backup-' + today;
  localStorage.setItem(backupKey, payload);
  // 清理超過 7 天的備份
  const keep = 7;
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('budget-tracker-backup-')) allKeys.push(k);
  }
  allKeys.sort();
  while (allKeys.length > keep) { localStorage.removeItem(allKeys.shift()); }
};

// ===== 備份管理 =====
window.showBackupModal = function() {
  const list = document.getElementById('backup-list');
  const backups = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('budget-tracker-backup-')) {
      backups.push({ key: k, date: k.replace('budget-tracker-backup-', '') });
    }
  }
  backups.sort((a, b) => b.date.localeCompare(a.date));
  if (backups.length === 0) {
    list.innerHTML = '<p class="text-gray-400 text-center py-4">尚無備份</p>';
  } else {
    list.innerHTML = backups.map(b => {
      const raw = localStorage.getItem(b.key);
      let info = '';
      try { const d = JSON.parse(raw); info = `${d.projects?.length || 0} 個計畫`; } catch(e) {}
      return `<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
          <span class="font-medium text-gray-800 dark:text-white">📅 ${escapeHtml(b.date)}</span>
          <span class="text-xs text-gray-400 ml-2">${escapeHtml(info)}</span>
        </div>
        <button onclick="restoreBackup('${escapeHtml(b.key)}')" class="bg-primary hover:bg-indigo-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition">還原</button>
      </div>`;
    }).join('');
  }
  document.getElementById('modal-backup').classList.add('open');
};

window.restoreBackup = function(key) {
  if (!confirm('確定還原此備份？現有資料將被取代。')) return;
  const raw = localStorage.getItem(key);
  if (!raw) return toast('找不到備份資料', 'error');
  try {
    const d = JSON.parse(raw);
    BT.data = d;
    if (!BT.data.vendors) BT.data.vendors = [];
    BT.save();
    BT.currentProjectId = null;
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    renderDashboard();
    closeAllModals();
    toast('備份已還原');
  } catch (e) { toast('還原失敗: ' + e.message, 'error'); }
};
