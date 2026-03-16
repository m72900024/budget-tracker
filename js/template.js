/**
 * template.js - 計畫模板 Modal（4 個預設模板）
 */

const TEMPLATES = [
  { name: '教育部補助計畫', desc: '教育部補助經費', categories: [
    {name:'人事費',budget:50000},{name:'經常門',budget:30000},{name:'資本門',budget:80000},{name:'雜支',budget:10000}
  ]},
  { name: '校內活動經費', desc: '校內自籌活動', categories: [
    {name:'場地費',budget:5000},{name:'材料費',budget:10000},{name:'餐費',budget:8000},{name:'交通費',budget:5000},{name:'雜支',budget:2000}
  ]},
  { name: '校外教學', desc: '戶外教育活動', categories: [
    {name:'租車費',budget:30000},{name:'門票/場地費',budget:15000},{name:'保險費',budget:5000},{name:'餐費',budget:10000},{name:'雜支',budget:3000}
  ]},
  { name: '資訊設備採購', desc: '資訊設備更新', categories: [
    {name:'硬體設備',budget:100000},{name:'軟體授權',budget:30000},{name:'安裝/維護',budget:10000}
  ]}
];

window.showTemplateModal = function() {
  const list = document.getElementById('template-list');
  list.innerHTML = TEMPLATES.map((t, i) => `
    <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition" onclick="createFromTemplate(${i})">
      <h4 class="font-bold text-gray-800 dark:text-white">${t.name}</h4>
      <p class="text-sm text-gray-500 dark:text-gray-400">${t.desc}</p>
      <p class="text-xs text-gray-400 mt-1">${t.categories.map(c => c.name).join(' · ')}</p>
    </div>
  `).join('');
  document.getElementById('modal-template').classList.add('open');
};

window.createFromTemplate = function(i) {
  const t = TEMPLATES[i];
  const proj = {
    id: uid(), name: t.name, desc: t.desc, year: '', deadline: '',
    categories: t.categories.map(c => ({ id: uid(), name: c.name, budget: c.budget, expenses: [] }))
  };
  BT.data.projects.push(proj);
  BT.save(); closeAllModals(); renderDashboard();
  toast(`已從模板建立「${t.name}」`);
  openProject(proj.id);
};
