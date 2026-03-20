/**
 * export.js - JSON/CSV 匯出入
 */

window.exportAll = function() {
  const blob = new Blob([JSON.stringify(BT.data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `budget-tracker-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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

function csvQuote(s) {
  s = String(s == null ? '' : s);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

window.exportCSV = function() {
  const header = '計畫名稱,計畫說明,計畫年度,計畫期限,類別名稱,類別預算,項目名稱,項目金額,廠商,日期,收據編號,狀態,備註';
  const rows = [header];
  BT.data.projects.forEach(p => {
    if (p.categories.length === 0) {
      rows.push([csvQuote(p.name), csvQuote(p.desc), csvQuote(p.year), csvQuote(p.deadline),
        '','','','','','','','',''].join(','));
    }
    p.categories.forEach(c => {
      if (c.expenses.length === 0) {
        rows.push([csvQuote(p.name), csvQuote(p.desc), csvQuote(p.year), csvQuote(p.deadline),
          csvQuote(c.name), c.budget, '','','','','','',''].join(','));
      }
      c.expenses.forEach(e => {
        const st = statusMap[e.status]?.label || e.status || '';
        rows.push([csvQuote(p.name), csvQuote(p.desc), csvQuote(p.year), csvQuote(p.deadline),
          csvQuote(c.name), c.budget,
          csvQuote(e.name), e.amount, csvQuote(e.vendor||''), csvQuote(e.date||''),
          csvQuote(e.receipt||''), csvQuote(st), csvQuote(e.note||'')].join(','));
      });
    });
  });
  const blob = new Blob(["\ufeff" + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `budget-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('CSV 已匯出');
};

window.printReport = function() { window.print(); };
