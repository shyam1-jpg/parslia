/**
 * Drop-in gate for static Pages: require auth, track page, mount user chip.
 * Include AFTER firebase-config + firebase compat SDKs + auth.js + activity.js
 *
 * <body data-parslia-gate="1"> or call ParsliaGate.run()
 */
(function (global) {
  'use strict';

  function run(opts) {
    opts = opts || {};
    var skipAuth = opts.skipAuth || document.body.getAttribute('data-parslia-public') === '1';
    if (global.ParsliaAuth) {
      global.ParsliaAuth.init();
      if (!skipAuth) {
        global.ParsliaAuth.requireAuth(opts.next);
      }
      // Delay chip until DOM ready
      var mount = function () {
        try { global.ParsliaAuth.mountUserChip(opts); } catch (e) {}
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
      else mount();
    }
    if (global.ParsliaActivity && !skipAuth) {
      var track = function () {
        // Wait briefly for auth user
        var tries = 0;
        var tick = function () {
          tries++;
          if ((global.ParsliaAuth && global.ParsliaAuth.getUser && global.ParsliaAuth.getUser()) || tries > 40) {
            try { global.ParsliaActivity.trackPage(); } catch (e) {}
            return;
          }
          setTimeout(tick, 100);
        };
        tick();
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', track);
      else track();
    }
  }

  global.ParsliaGate = { run: run };

  if (document.body && document.body.getAttribute('data-parslia-autogate') === '1') {
    run();
  } else {
    // Default: auto-run on gated pages that include this script without data-parslia-public
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body && document.body.getAttribute('data-parslia-public') === '1') return;
      if (document.body && document.body.getAttribute('data-parslia-autogate') === '0') return;
      run();
    });
  }
})(typeof window !== 'undefined' ? window : this);
