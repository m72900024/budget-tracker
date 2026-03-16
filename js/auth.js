/**
 * auth.js - Firebase Auth + Google 登入/登出 UI
 */

function initAuth() {
  const provider = new firebase.auth.GoogleAuthProvider();

  BT.signIn = function() {
    firebase.auth().signInWithPopup(provider).catch(err => {
      toast('登入失敗: ' + err.message, 'error');
    });
  };

  BT.signOut = function() {
    firebase.auth().signOut().then(() => {
      toast('已登出');
    }).catch(err => {
      toast('登出失敗: ' + err.message, 'error');
    });
  };

  firebase.auth().onAuthStateChanged(async function(user) {
    if (user) {
      BT.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: ADMIN_EMAILS.includes(user.email)
      };
      showAppUI();
      await loadFromFirestore();
      renderDashboard();
    } else {
      BT.currentUser = null;
      BT.data = { projects: [], vendors: [] };
      showLoginUI();
    }
  });
}

function showLoginUI() {
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('app-container').classList.add('hidden');
  updateUserUI();
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
    let html = '<div class="user-info">';
    if (BT.currentUser.photoURL) {
      html += `<img src="${BT.currentUser.photoURL}" alt="avatar" class="user-avatar" referrerpolicy="no-referrer">`;
    }
    html += `<span class="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline">${BT.currentUser.displayName || BT.currentUser.email}</span>`;
    html += `<button onclick="BT.signOut()" class="bg-red-100 dark:bg-red-900 hover:bg-red-200 text-danger font-bold py-1.5 px-3 rounded-lg text-xs transition">登出</button>`;
    html += '</div>';
    userInfoEl.innerHTML = html;
  } else {
    userInfoEl.innerHTML = '';
  }
}
