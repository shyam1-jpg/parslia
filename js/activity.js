/**
 * Parslia per-user activity tracking → Firestore users/{uid}/events
 * Exposes window.ParsliaActivity
 */
(function (global) {
  'use strict';

  var videoMarks = new WeakMap();
  var pageTracked = false;
  var clickBound = false;
  var formBound = false;

  function db() {
    return global.ParsliaAuth && global.ParsliaAuth.getDb && global.ParsliaAuth.getDb();
  }
  function user() {
    return global.ParsliaAuth && global.ParsliaAuth.getUser && global.ParsliaAuth.getUser();
  }

  function logEvent(type, payload) {
    payload = payload || {};
    var u = user();
    var database = db();
    if (!u || !database || typeof firebase === 'undefined') {
      return Promise.resolve(null);
    }
    var path = (location.pathname.split('/').pop() || '') + (location.hash || '');
    var doc = {
      type: String(type || 'event'),
      label: payload.label || payload.title || type || '',
      path: payload.path || path,
      href: payload.href || location.href,
      meta: payload.meta || {},
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      clientAt: new Date().toISOString()
    };
    if (payload.progress != null) doc.progress = payload.progress;
    if (payload.src) doc.src = payload.src;
    if (payload.formId) doc.formId = payload.formId;

    var events = database.collection('users').doc(u.uid).collection('events');
    var writeEvent = events.add(doc);
    var touchUser = database.collection('users').doc(u.uid).set({
      lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastPath: path
    }, { merge: true });
    return Promise.all([writeEvent, touchUser]).then(function (res) {
      return res[0];
    }).catch(function (err) {
      console.warn('[ParsliaActivity] logEvent failed', err);
      return null;
    });
  }

  function trackPage() {
    if (pageTracked) return;
    pageTracked = true;
    var title = document.title || '';
    logEvent('page_view', {
      label: title,
      path: (location.pathname.split('/').pop() || '') + (location.hash || '')
    });
    wireVideos();
    wireClicks();
    wireFormSaves();
  }

  function videoLabel(el) {
    return el.getAttribute('data-track-label') ||
      el.getAttribute('title') ||
      el.getAttribute('aria-label') ||
      (el.querySelector && (el.querySelector('source') || {}).src) ||
      el.currentSrc || el.src || 'video';
  }

  function attachVideo(el) {
    if (!el || el.__parsliaTracked) return;
    el.__parsliaTracked = true;
    videoMarks.set(el, { 25: false, 50: false, 75: false });

    el.addEventListener('play', function () {
      logEvent('video_play', { label: videoLabel(el), src: el.currentSrc || el.src || '' });
    });
    el.addEventListener('timeupdate', function () {
      if (!el.duration || !isFinite(el.duration)) return;
      var pct = (el.currentTime / el.duration) * 100;
      var marks = videoMarks.get(el) || {};
      [25, 50, 75].forEach(function (m) {
        if (pct >= m && !marks[m]) {
          marks[m] = true;
          videoMarks.set(el, marks);
          logEvent('video_progress', {
            label: videoLabel(el),
            src: el.currentSrc || el.src || '',
            progress: m,
            meta: { percent: m }
          });
        }
      });
    });
    el.addEventListener('ended', function () {
      logEvent('video_complete', { label: videoLabel(el), src: el.currentSrc || el.src || '', progress: 100 });
    });
  }

  function wireVideos() {
    document.querySelectorAll('video.site-video, video').forEach(attachVideo);
    // Iframes (YouTube etc.): page_view already covers embed presence; observe visibility clicks on wrappers
    document.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]').forEach(function (frame) {
      if (frame.__parsliaTracked) return;
      frame.__parsliaTracked = true;
      var wrap = frame.parentElement || frame;
      wrap.addEventListener('click', function () {
        logEvent('video_embed_click', {
          label: frame.getAttribute('title') || 'embedded video',
          src: frame.getAttribute('src') || ''
        });
      }, { once: false });
    });
  }

  function wireClicks() {
    if (clickBound) return;
    clickBound = true;
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-track], .nav a, .bottom a, .navin a, header a.btn, a.btn');
      if (!t) return;
      var label = t.getAttribute('data-track') || t.getAttribute('aria-label') || (t.textContent || '').trim().slice(0, 80) || t.getAttribute('href') || 'click';
      var href = t.getAttribute('href') || '';
      // Skip pure hash spam somewhat — still log important nav
      logEvent('click', { label: label, href: href, meta: { tag: t.tagName } });
    }, true);
  }

  function wireFormSaves() {
    if (formBound) return;
    formBound = true;
    document.addEventListener('parslia:form-save', function (ev) {
      var d = (ev && ev.detail) || {};
      logEvent('form_save', {
        label: d.label || d.formId || 'form',
        formId: d.formId || '',
        meta: d.meta || {}
      });
    });

    // Patch localStorage.setItem for known kitchen form keys
    try {
      var native = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function (key, value) {
        native(key, value);
        var k = String(key || '');
        if (/form|competency|record|sop|haccp|parslia|vedanta|kitchen/i.test(k)) {
          logEvent('form_save', {
            label: 'localStorage:' + k,
            formId: k,
            meta: { storage: 'localStorage' }
          });
        }
      };
    } catch (e) {}
  }

  function recentEvents(limit) {
    var u = user();
    var database = db();
    if (!u || !database) return Promise.resolve([]);
    return database.collection('users').doc(u.uid).collection('events')
      .orderBy('createdAt', 'desc')
      .limit(limit || 50)
      .get()
      .then(function (snap) {
        return snap.docs.map(function (d) {
          var data = d.data() || {};
          data.id = d.id;
          return data;
        });
      });
  }

  function getProfile() {
    var u = user();
    var database = db();
    if (!u || !database) return Promise.resolve(null);
    return database.collection('users').doc(u.uid).get().then(function (snap) {
      return snap.exists ? Object.assign({ uid: u.uid }, snap.data()) : { uid: u.uid, email: u.email, displayName: u.displayName };
    });
  }

  global.ParsliaActivity = {
    logEvent: logEvent,
    trackPage: trackPage,
    wireVideos: wireVideos,
    recentEvents: recentEvents,
    getProfile: getProfile
  };
})(typeof window !== 'undefined' ? window : this);
