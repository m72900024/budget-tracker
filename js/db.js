/**
 * db.js - 資料層：預設 localStorage，登入後 Firestore 同步
 */

// ===== localStorage 操作 =====
function loadFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const d = JSON.parse(raw);
      BT.data.projects = d.projects || [];
      BT.data.vendors = d.vendors || [];
      // 確保欄位完整
      BT.data.projects.forEach(p => {
        if (!p.year) p.year = '';
        if (!p.deadline) p.deadline = '';
      });
    } catch (e) {
      console.error('localStorage parse error:', e);
    }
  }
}

function saveToLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    projects: BT.data.projects,
    vendors: BT.data.vendors
  }));
}

// ===== Firestore 操作 =====
function getFirestoreDocRef() {
  if (!BT.currentUser) return null;
  return firebase.firestore().collection(FIRESTORE_COLLECTION).doc(BT.currentUser.uid);
}

// 從 Firestore 載入（回傳 true 表示有資料）
async function loadFromFirestore() {
  const ref = getFirestoreDocRef();
  if (!ref) return false;

  const doc = await ref.get();
  if (doc.exists) {
    const d = doc.data();
    BT.data.projects = d.projects || [];
    BT.data.vendors = d.vendors || [];
    BT.data.projects.forEach(p => {
      if (!p.year) p.year = '';
      if (!p.deadline) p.deadline = '';
    });
    // 同步到 localStorage 當離線備份
    saveToLocal();
    return true;
  }
  return false;
}

// ===== 統一儲存（同時寫 localStorage + Firestore） =====
BT.save = async function() {
  // 一律存 localStorage
  saveToLocal();

  // 有登入就同步 Firestore
  const ref = getFirestoreDocRef();
  if (ref) {
    try {
      await ref.set({
        projects: BT.data.projects,
        vendors: BT.data.vendors
      });
    } catch (err) {
      console.error('Firestore save error:', err);
      // 不彈 toast，localStorage 已存好
    }
  }
};
