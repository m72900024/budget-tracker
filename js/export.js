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
        const mode = confirm(`匯入 ${d.projects.length} 個計畫。\n\n按「確定」→ 取代現有資料\n按「取消」→ 合併（新增不覆蓋）`);
        if (mode) {
          BT.data = d;
          if (!BT.data.vendors) BT.data.vendors = [];
        } else {
          const existingIds = new Set(BT.data.projects.map(p => p.id));
          (d.projects || []).forEach(p => { if (!existingIds.has(p.id)) BT.data.projects.push(p); });
          (d.vendors || []).forEach(v => { if (!BT.data.vendors.includes(v)) BT.data.vendors.push(v); });
          BT.data.vendors.sort((a, b) => a.localeCompare(b, 'zh-TW'));
        }
        BT.save();
        BT.currentProjectId = null;
        document.getElementById('detail-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        renderDashboard();
        toast('JSON 匯入成功');
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

// ===== CSV 匯入 =====
window.importCSV = function() {
  document.getElementById('import-csv-file').click();
};

function parseCSVLine(line) {
  const result = [];
  let i = 0, field = '', inQuote = false;
  while (i < line.length) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuote = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
        i++;
      } else if (ch === ',') {
        result.push(field);
        field = '';
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  result.push(field);
  return result;
}

function resolveStatusKey(label) {
  if (!label) return 'pending';
  const trimmed = label.trim();
  if (statusMap[trimmed]) return trimmed;
  if (statusLabelToKey[trimmed]) return statusLabelToKey[trimmed];
  for (const [k, v] of Object.entries(statusMap)) {
    if (trimmed.includes(v.label) || v.label.includes(trimmed)) return k;
  }
  return 'pending';
}

function initCSVImportListener() {
  document.getElementById('import-csv-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        let text = ev.target.result;
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error('CSV 檔案內容不足');

        const headerFields = parseCSVLine(lines[0]);
        if (headerFields[0].trim() !== '計畫名稱') {
          throw new Error('CSV 標頭格式不符，第一欄應為「計畫名稱」');
        }

        const projectMap = new Map();
        const vendorSet = new Set(BT.data.vendors);

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 5) continue;

          const [projName, projDesc, projYear, projDeadline, catName, catBudgetStr,
            expName, expAmountStr, vendor, date, receipt, statusLabel, note] = cols.map(c => (c||'').trim());

          if (!projName) continue;

          let proj = projectMap.get(projName);
          if (!proj) {
            proj = { id: uid(), name: projName, desc: projDesc || '', year: projYear || '', deadline: projDeadline || '', categories: [], _catMap: new Map() };
            projectMap.set(projName, proj);
          }

          if (!catName) continue;

          let cat = proj._catMap.get(catName);
          if (!cat) {
            cat = { id: uid(), name: catName, budget: parseFloat(catBudgetStr) || 0, expenses: [] };
            proj._catMap.set(catName, cat);
            proj.categories.push(cat);
          }
          const newBudget = parseFloat(catBudgetStr) || 0;
          if (newBudget > 0 && newBudget !== cat.budget) cat.budget = newBudget;

          if (!expName) continue;

          const amount = parseFloat(expAmountStr) || 0;
          if (vendor) vendorSet.add(vendor);
          cat.expenses.push({
            id: uid(), name: expName, amount: amount,
            vendor: vendor || '', date: date || '', receipt: receipt || '',
            status: resolveStatusKey(statusLabel), note: note || ''
          });
        }

        const projects = [...projectMap.values()].map(p => { delete p._catMap; return p; });
        if (projects.length === 0) throw new Error('未解析到任何計畫資料');

        const csvMode = confirm(`從 CSV 匯入 ${projects.length} 個計畫。\n\n按「確定」→ 取代現有資料\n按「取消」→ 合併（新增不覆蓋）`);
        if (csvMode) {
          BT.data.projects = projects;
          BT.data.vendors = [...vendorSet].sort((a, b) => a.localeCompare(b, 'zh-TW'));
        } else {
          const existingNames = new Set(BT.data.projects.map(p => p.name));
          projects.forEach(p => { if (!existingNames.has(p.name)) BT.data.projects.push(p); });
          [...vendorSet].forEach(v => { if (!BT.data.vendors.includes(v)) BT.data.vendors.push(v); });
          BT.data.vendors.sort((a, b) => a.localeCompare(b, 'zh-TW'));
        }
        BT.save();
        BT.currentProjectId = null;
        document.getElementById('detail-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        renderDashboard();
        toast(`CSV 匯入成功：${projects.length} 個計畫`);
      } catch (err) {
        toast('CSV 匯入失敗: ' + err.message, 'error');
      }
    };
    r.readAsText(f, 'UTF-8');
    e.target.value = '';
  });
}

window.printReport = function() { window.print(); };
