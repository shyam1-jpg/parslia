/**
 * Parslia / The Vedānta — Firebase web config (PLACEHOLDER)
 * ---------------------------------------------------------
 * Owner setup (see AUTH-SETUP.md):
 * 1. Create a Firebase project
 * 2. Enable Authentication → Email/Password
 * 3. Create a Firestore database
 * 4. Register a Web app and paste the config values BELOW
 * 5. Redeploy / push this file (do not commit real secrets to public forks
 *    if you prefer env-based injection later — for GitHub Pages the web
 *    apiKey is expected to be public and protected by Firebase Security Rules)
 *
 * Required fields: apiKey, authDomain, projectId, appId
 * Optional but usual: storageBucket, messagingSenderId
 */
(function (global) {
  'use strict';

  /** @type {{apiKey:string,authDomain:string,projectId:string,storageBucket:string,messagingSenderId:string,appId:string}} */
  global.PARSLIA_FIREBASE = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };

  function isReady(cfg) {
    if (!cfg) return false;
    var required = ['apiKey', 'authDomain', 'projectId', 'appId'];
    for (var i = 0; i < required.length; i++) {
      var v = cfg[required[i]];
      if (!v || String(v).trim() === '') return false;
    }
    return true;
  }

  global.PARSLIA_FIREBASE_READY = isReady(global.PARSLIA_FIREBASE);
  global.ParsliaFirebaseConfig = {
    get: function () { return global.PARSLIA_FIREBASE; },
    isReady: function () { return isReady(global.PARSLIA_FIREBASE); },
    refreshReady: function () {
      global.PARSLIA_FIREBASE_READY = isReady(global.PARSLIA_FIREBASE);
      return global.PARSLIA_FIREBASE_READY;
    }
  };
})(typeof window !== 'undefined' ? window : this);
