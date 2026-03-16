/**
 * config.js - Firebase 設定 + 管理員名單 + 常數
 */

const firebaseConfig = {
  apiKey: "AIzaSyClniX_uQNPDRC8bTLZP-s3-aGB6466t1c",
  authDomain: "github-f016e.firebaseapp.com",
  projectId: "github-f016e",
  storageBucket: "github-f016e.firebasestorage.app",
  messagingSenderId: "726498300688",
  appId: "1:726498300688:web:903d43c66c35b74e3e05d3"
};

const ADMIN_EMAILS = ['m72900024@gmail.com'];
const STORAGE_KEY = 'budget-tracker-data';
const FIRESTORE_COLLECTION = 'budget-tracker';

const statusMap = {
  pending:   { label:'⏳ 待核銷', color:'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  submitted: { label:'📝 已送件', color:'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  approved:  { label:'✅ 已核銷', color:'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  rejected:  { label:'❌ 退件',   color:'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
};
