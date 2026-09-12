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

  global.ParsliaAuth = {
    init: init,
    requireAuth: requireAuth,
    logout: logout,
    login: login,
    register: register,
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
