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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    projects: BT.data.projects,
    vendors: BT.data.vendors
  }));
};
