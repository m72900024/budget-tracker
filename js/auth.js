/**
 * auth.js - 登入選配：預設 localStorage，登入後雲端同步
 */

function initAuth() {
  const provider = new firebase.auth.GoogleAuthProvider();

  BT.signIn = function() {
    // 優先用 redirect（GitHub Pages 擋 popup）
    firebase.auth().signInWithRedirect(provider).catch(err => {
      toast('登入失敗: ' + err.message, 'error');
    });
  };

  BT.signOut = function() {
    firebase.auth().signOut().then(() => {
      BT.currentUser = null;
      updateUserUI();
      toast('已登出，資料仍保存在本機');
    }).catch(err => {
      toast('登出失敗: ' + err.message, 'error');
    });
  };

  // 處理 redirect 回來的結果
  firebase.auth().getRedirectResult().then(async result => {
    if (result.user) {
      await handleLogin(result.user);
    }
  }).catch(err => {
    console.error('Redirect auth error:', err);
    // 登入失敗不影響 localStorage 使用
  });

  // 監聽 auth 狀態（重新整理頁面時恢復登入）
  firebase.auth().onAuthStateChanged(async function(user) {
    if (user) {
      await handleLogin(user);
    } else {
      BT.currentUser = null;
      updateUserUI();
    }
  });
}

async function handleLogin(user) {
  BT.currentUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAdmin: ADMIN_EMAILS.includes(user.email)
  };
  updateUserUI();

  // 登入後嘗試從 Firestore 載入
  try {
    const loaded = await loadFromFirestore();
    if (loaded) {
      renderDashboard();
      toast('已從雲端同步資料 ☁️');
    } else {
      // Firestore 無資料，把本地資料上傳
      await BT.save();
      toast('已將本地資料同步至雲端 ☁️');
    }
  } catch (err) {
    console.error('Cloud sync error:', err);
    toast('雲端同步失敗，使用本地資料', 'warning');
  }
}

function showAppUI() {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  updateUserUI();
}

function updateUserUI() {
  const userInfoEl = document.getElementById('user-info');
  if (!userInfoEl) return;

  if (BT.currentUser) {
    let html = '<div class="flex items-center gap-2">';
    if (BT.currentUser.photoURL) {
      html += `<img src="${BT.currentUser.photoURL}" alt="avatar" class="w-7 h-7 rounded-full" referrerpolicy="no-referrer">`;
    }
    html += `<span class="text-xs text-gray-600 dark:text-gray-300 hidden md:inline">${BT.currentUser.displayName || BT.currentUser.email}</span>`;
    html += `<span class="text-xs text-green-600 dark:text-green-400">☁️ 同步中</span>`;
    html += `<button onclick="BT.signOut()" class="bg-red-100 dark:bg-red-900 hover:bg-red-200 text-danger font-bold py-1.5 px-3 rounded-lg text-xs transition">登出</button>`;
    html += '</div>';
    userInfoEl.innerHTML = html;
  } else {
    userInfoEl.innerHTML = `<button onclick="BT.signIn()" class="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 text-blue-700 dark:text-blue-300 font-bold py-1.5 px-3 rounded-lg text-xs transition flex items-center gap-1">
      <span>☁️</span> 登入同步
    </button>`;
  }
}
