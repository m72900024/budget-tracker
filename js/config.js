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
