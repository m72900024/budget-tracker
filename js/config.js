/**
 * config.js - 常數設定
 */

const STORAGE_KEY = 'budget-tracker-data';

const statusMap = {
  pending:   { label:'⏳ 待核銷', color:'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  submitted: { label:'📝 已送件', color:'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  approved:  { label:'✅ 已核銷', color:'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  rejected:  { label:'❌ 退件',   color:'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
};

// 狀態標籤 → key 的反向對應（CSV 匯入用）
const statusLabelToKey = {};
Object.entries(statusMap).forEach(([k, v]) => {
  statusLabelToKey[v.label] = k;
  statusLabelToKey[v.label.replace(/^[^\u4e00-\u9fff]+/, '')] = k;
});
statusLabelToKey['待核銷'] = 'pending';
statusLabelToKey['已送件'] = 'submitted';
statusLabelToKey['已核銷'] = 'approved';
statusLabelToKey['退件'] = 'rejected';
