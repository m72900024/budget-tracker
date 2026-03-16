/**
 * vendor.js - 廠商管理 Modal
 */

function refreshVendorDropdown() {
  const s = document.getElementById('inp-exp-vendor');
  const v = s.value;
  s.innerHTML = '<option value="">-- 不指定 --</option>';
  BT.data.vendors.forEach(v => { s.innerHTML += `<option value="${v}">${v}</option>`; });
  s.value = v;
}

function renderVendorList() {
  const l = document.getElementById('vendor-list');
  if (!BT.data.vendors.length) {
    l.innerHTML = '<p class="text-gray-400 text-center py-4">尚無廠商</p>';
    return;
  }
  l.innerHTML = BT.data.vendors.map((v, i) =>
    `<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <span class="font-medium text-gray-800 dark:text-white">🏪 ${v}</span>
      <div class="flex gap-1">
        <button onclick="renameVendor(${i})" class="text-gray-400 hover:text-primary text-sm">✏️</button>
        <button onclick="deleteVendor(${i})" class="text-gray-400 hover:text-danger text-sm">🗑️</button>
      </div>
    </div>`
  ).join('');
}

window.showVendorModal = function() {
  renderVendorList();
  document.getElementById('inp-vendor-name').value = '';
  document.getElementById('modal-vendor').classList.add('open');
  document.getElementById('inp-vendor-name').focus();
};

window.addVendor = function() {
  const n = document.getElementById('inp-vendor-name').value.trim();
  if (!n) return;
  if (BT.data.vendors.includes(n)) return toast('此廠商已存在', 'error');
  BT.data.vendors.push(n);
  BT.data.vendors.sort((a, b) => a.localeCompare(b, 'zh-TW'));
  BT.save();
  document.getElementById('inp-vendor-name').value = '';
  renderVendorList(); refreshVendorDropdown();
  toast('廠商已新增');
};

window.renameVendor = function(i) {
  const old = BT.data.vendors[i];
  const n = prompt('修改廠商名稱：', old);
  if (!n || !n.trim() || n.trim() === old) return;
  if (BT.data.vendors.includes(n.trim())) return toast('名稱已存在', 'error');
  let count = 0;
  BT.data.projects.forEach(p => p.categories.forEach(c => c.expenses.forEach(e => {
    if (e.vendor === old) { e.vendor = n.trim(); count++; }
  })));
  BT.data.vendors[i] = n.trim();
  BT.data.vendors.sort((a, b) => a.localeCompare(b, 'zh-TW'));
  BT.save(); renderVendorList(); refreshVendorDropdown();
  if (BT.currentProjectId) renderDetail();
  toast(`已更新，同步修改 ${count} 筆紀錄`);
};

window.deleteVendor = function(i) {
  const name = BT.data.vendors[i];
  let count = 0;
  BT.data.projects.forEach(p => p.categories.forEach(c => c.expenses.forEach(e => {
    if (e.vendor === name) count++;
  })));
  if (!confirm(count > 0 ? `「${name}」有 ${count} 筆紀錄在使用，確定刪除？` : `確定刪除「${name}」？`)) return;
  if (count > 0) BT.data.projects.forEach(p => p.categories.forEach(c => c.expenses.forEach(e => {
    if (e.vendor === name) e.vendor = '';
  })));
  BT.data.vendors.splice(i, 1);
  BT.save(); renderVendorList(); refreshVendorDropdown();
  if (BT.currentProjectId) renderDetail();
  toast('廠商已刪除', 'warning');
};

window.quickAddVendor = function() {
  const n = prompt('輸入新廠商名稱：');
  if (!n || !n.trim()) return;
  if (BT.data.vendors.includes(n.trim())) {
    document.getElementById('inp-exp-vendor').value = n.trim();
    return;
  }
  BT.data.vendors.push(n.trim());
  BT.data.vendors.sort((a, b) => a.localeCompare(b, 'zh-TW'));
  BT.save(); refreshVendorDropdown();
  document.getElementById('inp-exp-vendor').value = n.trim();
  toast('廠商已新增');
};
