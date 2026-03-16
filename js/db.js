/**
 * db.js - Firestore CRUD（save/load）+ localStorage 遷移
 */

function getFirestoreDocRef() {
  if (!BT.currentUser) return null;
  return firebase.firestore().collection(FIRESTORE_COLLECTION).doc(BT.currentUser.uid);
}

// 儲存到 Firestore
BT.save = async function() {
  const ref = getFirestoreDocRef();
  if (!ref) return;
  try {
    await ref.set({
      projects: BT.data.projects,
      vendors: BT.data.vendors
    });
  } catch (err) {
    console.error('Firestore save error:', err);
    toast('儲存失敗: ' + err.message, 'error');
  }
};

// 從 Firestore 載入
async function loadFromFirestore() {
  const ref = getFirestoreDocRef();
  if (!ref) return;

  try {
    const doc = await ref.get();
    if (doc.exists) {
      const d = doc.data();
      BT.data.projects = d.projects || [];
      BT.data.vendors = d.vendors || [];
      // 確保每個計畫有 year 和 deadline 欄位
      BT.data.projects.forEach(p => {
        if (!p.year) p.year = '';
        if (!p.deadline) p.deadline = '';
      });
    } else {
      // Firestore 無資料，嘗試從 localStorage 遷移
      await migrateFromLocalStorage();
    }
  } catch (err) {
    console.error('Firestore load error:', err);
    toast('載入失敗: ' + err.message, 'error');
  }
}

// 首次登入遷移：localStorage → Firestore
async function migrateFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const d = JSON.parse(raw);
    if (d && d.projects) {
      BT.data.projects = d.projects;
      BT.data.vendors = d.vendors || [];
      BT.data.projects.forEach(p => {
        if (!p.year) p.year = '';
        if (!p.deadline) p.deadline = '';
      });
      // 上傳到 Firestore
      await BT.save();
      // 清除 localStorage
      localStorage.removeItem(STORAGE_KEY);
      toast('已將本地資料遷移至雲端', 'info');
    }
  } catch (e) {
    console.error('Migration error:', e);
  }
}
