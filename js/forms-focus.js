/**
 * One-section focus mode for long SOP / forms pages.
 * URL: ?focus=sectionId  (and optional #sectionId)
 * Hides sibling .card / section.card / [data-forms-section] except the focus target.
 * Adds a sticky "All forms" bar back to forms-hub.html.
 */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var focus = params.get('focus') || (location.hash ? location.hash.replace(/^#/, '') : '');
  if (!focus) return;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var target = document.getElementById(focus);
    if (!target) return;

    var bar = document.createElement('div');
    bar.setAttribute('role', 'navigation');
    bar.innerHTML = '<a href="forms-hub.html">← All forms</a><span>Focused form view</span>';
    bar.style.cssText = 'position:sticky;top:0;z-index:80;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:#4F3066;color:#fff;border-bottom:2px solid #C6A66F;font:600 13px Outfit,system-ui,sans-serif';
    var link = bar.querySelector('a');
    link.style.cssText = 'color:#fff;text-decoration:none;padding:8px 12px;border:1px solid rgba(255,255,255,.3);border-radius:999px';
    document.body.insertBefore(bar, document.body.firstChild);

    var candidates = document.querySelectorAll('section.card, .card[id], section[id], article[id]');
    candidates.forEach(function (el) {
      if (el === target || el.contains(target) || target.contains(el)) {
        el.style.display = '';
        el.style.scrollMarginTop = '64px';
        return;
      }
      // hide other major cards/sections that are direct content blocks
      if (el.tagName === 'SECTION' || (el.classList && el.classList.contains('card') && el.id)) {
        el.setAttribute('data-forms-hidden', '1');
        el.style.display = 'none';
      }
    });

    // Also hide common chrome that isn't the form (optional: keep header)
    target.scrollIntoView({ block: 'start', behavior: 'instant' in window ? 'instant' : 'auto' });
    try { target.focus({ preventScroll: true }); } catch (e) {}
  });
})();
