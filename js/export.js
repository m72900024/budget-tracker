/**
 * export.js - JSON/CSV 匯出入
 */

window.exportAll = function() {
  const blob = new Blob([JSON.stringify(BT.data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `budget-tracker-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  toast('JSON 已匯出');
};

window.importAll = function() {
  document.getElementById('import-file').click();
};

// 匯入檔案監聽（在 init 後由 DOM ready 呼叫）
function initImportListener() {
  document.getElementById('import-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        if (!d.projects) throw new Error('格式不正確');
        if (!confirm(`匯入 ${d.projects.length} 個計畫？`)) return;
        BT.data = d;
        if (!BT.data.vendors) BT.data.vendors = [];
        BT.save();
        BT.currentProjectId = null;
        document.getElementById('detail-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        renderDashboard();
        toast('匯入成功');
      } catch (err) {
        toast('匯入失敗: ' + err.message, 'error');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  });
}

window.exportCSV = function() {
  const rows = ['計畫,類別,項目,金額,廠商,日期,收據,狀態,備註'];
  BT.data.projects.forEach(p => p.categories.forEach(c => {
    if (c.expenses.length === 0) rows.push(`"${p.name}","${c.name}","(無核銷)",${c.budget},,,,預算,`);
    c.expenses.forEach(e => {
      const st = statusMap[e.status]?.label || e.status;
      rows.push(`"${p.name}","${c.name}","${e.name}",${e.amount},"${e.vendor||''}","${e.date||''}","${e.receipt||''}","${st}","${e.note||''}"`);
    });
  }));
  const blob = new Blob(["\ufeff" + rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `budget-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  toast('CSV 已匯出');
};

window.printReport = function() { window.print(); };
