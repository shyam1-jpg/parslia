/**
 * Parslia / The Vedanta — Firebase web config (the-vedanta)
 * ---------------------------------------------------------
 * Configured from Firebase Console → THE VEDANTA → Project settings → Web app.
 * Web apiKey is public for GitHub Pages; protect data with Firebase Security Rules.
 *
 * Required fields: apiKey, authDomain, projectId, appId
 * Optional but usual: storageBucket, messagingSenderId
 */
(function (global) {
  'use strict';

  /** @type {{apiKey:string,authDomain:string,projectId:string,storageBucket:string,messagingSenderId:string,appId:string}} */
  global.PARSLIA_FIREBASE = {
    apiKey: 'AIzaSyAufPj-x1FK5czAAnxOmVrm9lwMJ9oSTd0',
    authDomain: 'the-vedanta.firebaseapp.com',
    projectId: 'the-vedanta',
    storageBucket: 'the-vedanta.firebasestorage.app',
    messagingSenderId: '726105094774',
    appId: '1:726105094774:web:f6c2bf522f5906834f3d57'
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