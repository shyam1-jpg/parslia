/**
 * Parslia staff auth — Firebase Auth (compat CDN) + Firestore profile
 * Exposes window.ParsliaAuth
 */
(function (global) {
  'use strict';

  var app = null;
  var auth = null;
  var db = null;
  var currentUser = null;
  var readyPromise = null;
  var authReadyResolvers = [];

  function cfgReady() {
    return !!(global.ParsliaFirebaseConfig && global.ParsliaFirebaseConfig.isReady());
  }

  function notifyAuthReady(user) {
    currentUser = user || null;
    var list = authReadyResolvers.splice(0);
    list.forEach(function (fn) { try { fn(currentUser); } catch (e) {} });
  }

  function whenAuthReady() {
    return new Promise(function (resolve) {
      if (auth && auth.currentUser !== undefined && currentUser !== undefined && readyPromise === 'done') {
        resolve(currentUser);
        return;
      }
      authReadyResolvers.push(resolve);
    });
  }

  function init() {
    if (readyPromise) return readyPromise;
    readyPromise = new Promise(function (resolve) {
      if (!cfgReady()) {
        readyPromise = null;
        resolve(null);
        return;
      }
      if (typeof firebase === 'undefined') {
        console.warn('[ParsliaAuth] Firebase SDK not loaded');
        readyPromise = null;
        resolve(null);
        return;
      }
      try {
        var cfg = global.PARSLIA_FIREBASE;
        if (!firebase.apps.length) {
          app = firebase.initializeApp(cfg);
        } else {
          app = firebase.app();
        }
        auth = firebase.auth();
        db = firebase.firestore();
        auth.onAuthStateChanged(function (user) {
          currentUser = user;
          if (readyPromise !== 'done') {
            readyPromise = 'done';
          }
          notifyAuthReady(user);
          if (user) {
            ensureUserProfile(user.uid, {
              displayName: user.displayName || '',
              email: user.email || '',
              role: (user && user.reloadUserInfo && user.reloadUserInfo.customAttributes) || undefined
            }).catch(function () {});
          }
          try {
            global.dispatchEvent(new CustomEvent('parslia:auth', { detail: { user: user } }));
          } catch (e) {}
        });
        resolve(auth);
      } catch (err) {
        console.error('[ParsliaAuth] init failed', err);
        readyPromise = null;
        resolve(null);
      }
    });
    return readyPromise;
  }

  function authPath() {
    return 'auth.html';
  }

  function requireAuth(redirectTo) {
    init();
    var next = redirectTo || (location.pathname.split('/').pop() || 'pro-dashboard.html') + (location.search || '') + (location.hash || '');
    return whenAuthReady().then(function (user) {
      if (!cfgReady()) {
        // Auth backend not configured yet — leave kitchen pages open; do not redirect.
        return null;
      }
      if (!user) {
        location.replace(authPath() + '?next=' + encodeURIComponent(next));
        return null;
      }
      return user;
    });
  }

  function logout() {
    init();
    if (!auth) {
      location.href = authPath();
      return Promise.resolve();
    }
    return auth.signOut().then(function () {
      location.href = authPath();
    }).catch(function (err) {
      console.error('[ParsliaAuth] logout', err);
      location.href = authPath();
    });
  }

  function ensureUserProfile(uid, info) {
    init();
    if (!db || !uid) return Promise.resolve(null);
    var ref = db.collection('users').doc(uid);
    return ref.get().then(function (snap) {
      var now = firebase.firestore.FieldValue.serverTimestamp();
      var payload = {
        email: (info && info.email) || '',
        displayName: (info && info.displayName) || '',
        lastSeenAt: now,
        lastPath: (location.pathname.split('/').pop() || '') + (location.hash || '')
      };
      if (info && info.role) payload.role = info.role;
      if (!snap.exists) {
        payload.createdAt = now;
        payload.role = (info && info.role) || 'Staff';
        return ref.set(payload, { merge: true });
      }
      // Do not overwrite role/displayName with empties on every visit
      var patch = { lastSeenAt: now, lastPath: payload.lastPath };
      if (payload.email) patch.email = payload.email;
      if (info && info.displayName) patch.displayName = info.displayName;
      if (info && info.role) patch.role = info.role;
      return ref.set(patch, { merge: true });
    });
  }

  function register(email, password, profile) {
    init();
    if (!auth) return Promise.reject(new Error('Auth not ready — paste Firebase config first.'));
    return auth.createUserWithEmailAndPassword(email, password).then(function (cred) {
      var user = cred.user;
      var displayName = (profile && profile.displayName) || '';
      var chain = Promise.resolve();
      if (displayName) {
        chain = user.updateProfile({ displayName: displayName });
      }
      return chain.then(function () {
        return ensureUserProfile(user.uid, {
          displayName: displayName,
          email: email,
          role: (profile && profile.role) || 'Staff'
        });
      }).then(function () { return user; });
    });
  }

  function login(email, password) {
    init();
    if (!auth) return Promise.reject(new Error('Auth not ready — paste Firebase config first.'));
    return auth.signInWithEmailAndPassword(email, password).then(function (cred) {
      return ensureUserProfile(cred.user.uid, {
        displayName: cred.user.displayName || '',
        email: cred.user.email || ''
      }).then(function () { return cred.user; });
    });
  }

  function getUser() { return currentUser || (auth && auth.currentUser) || null; }
  function getDb() { init(); return db; }
  function getAuth() { init(); return auth; }

  function mountUserChip(opts) {
    opts = opts || {};
    var host = opts.host || document.querySelector('.topin, .top .topin, header .hero-inner, .site-hero .hero-inner, header');
    if (!host) return;
    var existing = document.getElementById('parslia-user-chip');
    if (existing) existing.remove();

    var chip = document.createElement('div');
    chip.id = 'parslia-user-chip';
    chip.setAttribute('data-track', 'user-chip');
    chip.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-left:auto;font-size:13px;';

    function render(user) {
      chip.innerHTML = '';
      if (!user) {
        var a = document.createElement('a');
        a.href = authPath() + '?next=' + encodeURIComponent((location.pathname.split('/').pop() || '') + location.hash);
        a.textContent = 'Sign in';
        a.className = 'btn ghost';
        a.style.cssText = 'min-height:36px;padding:6px 12px;background:transparent;color:#f8f3e9;border:1px solid rgba(198,166,111,.5);border-radius:11px;text-decoration:none;font-weight:600;';
        chip.appendChild(a);
        return;
      }
      var label = document.createElement('span');
      label.textContent = user.displayName || user.email || 'Staff';
      label.style.cssText = 'opacity:.92;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      var act = document.createElement('a');
      act.href = 'my-activity.html';
      act.textContent = 'My activity';
      act.setAttribute('data-track', 'nav-my-activity');
      act.style.cssText = 'min-height:36px;padding:6px 10px;border-radius:11px;border:1px solid rgba(198,166,111,.45);color:#eadcc3;text-decoration:none;font-weight:600;';
      var out = document.createElement('button');
      out.type = 'button';
      out.textContent = 'Logout';
      out.setAttribute('data-track', 'logout');
      out.style.cssText = 'min-height:36px;padding:6px 12px;border-radius:11px;border:0;background:#c6a66f;color:#201b14;font-weight:700;cursor:pointer;';
      out.addEventListener('click', function () { logout(); });
      chip.appendChild(label);
      chip.appendChild(act);
      chip.appendChild(out);
    }

    // Prefer appending inside sticky top bars
    if (host.classList && (host.classList.contains('topin') || host.querySelector)) {
      host.appendChild(chip);
    } else {
      host.appendChild(chip);
    }
    render(getUser());
    global.addEventListener('parslia:auth', function (ev) {
      render(ev.detail && ev.detail.user);
    });
  }


  var ERROR_MAP = {
    'auth/invalid-email': 'That email address does not look valid.',
    'auth/user-disabled': 'This staff account has been disabled. Ask your manager.',
    'auth/user-not-found': 'No account found for that email. Try creating one.',
    'auth/wrong-password': 'Incorrect password. Try again or reset it.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with that email already exists. Sign in instead.',
    'auth/weak-password': 'Choose a stronger password (at least 6 characters).',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled yet.',
    'auth/unauthorized-domain': 'This site is not authorised for sign-in. Ask your admin to add the domain in Firebase.',
    'auth/popup-closed-by-user': 'Sign-in window was closed before finishing.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/missing-email': 'Enter your email address first.',
    'auth/requires-recent-login': 'For security, please sign in again and retry.',
    'auth/password-mismatch': 'Passwords do not match.'
  };

  function friendlyAuthError(err) {
    if (!err) return 'Something went wrong. Please try again.';
    var code = err.code || '';
    if (ERROR_MAP[code]) return ERROR_MAP[code];
    var msg = err.message || String(err);
    // Strip Firebase noise prefixes
    msg = msg.replace(/^Firebase:\s*/i, '').replace(/\s*\(auth\/[^)]+\)\.?$/, '').trim();
    return msg || 'Something went wrong. Please try again.';
  }

  function resetPassword(email) {
    init();
    if (!auth) return Promise.reject(new Error('Auth not ready — Firebase is not configured.'));
    var trimmed = (email || '').trim();
    if (!trimmed) return Promise.reject(Object.assign(new Error('Enter your email first.'), { code: 'auth/missing-email' }));
    return auth.sendPasswordResetEmail(trimmed);
  }

  function registerWithConfirm(email, password, confirmPassword, profile) {
    if ((password || '') !== (confirmPassword || '')) {
      return Promise.reject(Object.assign(new Error('Passwords do not match.'), { code: 'auth/password-mismatch' }));
    }
    ERROR_MAP['auth/password-mismatch'] = 'Passwords do not match.';
    return register(email, password, profile);
  }

  global.ParsliaAuth = {
    init: init,
    requireAuth: requireAuth,
    logout: logout,
    login: login,
    register: register,
    registerWithConfirm: registerWithConfirm,
    resetPassword: resetPassword,
    friendlyAuthError: friendlyAuthError,
    ensureUserProfile: ensureUserProfile,
    getUser: getUser,
    getDb: getDb,
    getAuth: getAuth,
    whenAuthReady: whenAuthReady,
    isConfigReady: cfgReady,
    mountUserChip: mountUserChip
  };

  // Auto-init when Firebase + config present
  if (cfgReady() && typeof firebase !== 'undefined') {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
