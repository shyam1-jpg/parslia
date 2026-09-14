/**
 * Parslia gate + shared brand/SOP amendments.
 * Keeps authentication behaviour intact and applies The Vedanta Way UI system.
 */
(function (global) {
  'use strict';

  var BRAND = {
    purple: '#4F3066',
    purpleDark: '#352044',
    purpleLight: '#7A61AD',
    gold: '#C6A66F',
    goldSoft: '#EADCC3',
    cream: '#F8F5FB',
    paper: '#FFFDF9',
    ink: '#2B1E3A'
  };

  function applySharedBranding() {
    try {
      var root = document.documentElement;
      root.style.setProperty('--forest', BRAND.purple);
      root.style.setProperty('--forest2', BRAND.purpleDark);
      root.style.setProperty('--forest-deep', BRAND.purpleDark);
      root.style.setProperty('--gold', BRAND.gold);
      root.style.setProperty('--gold-soft', BRAND.goldSoft);
      root.style.setProperty('--paper', BRAND.cream);
      root.style.setProperty('--ivory', BRAND.cream);
      root.style.setProperty('--ink', BRAND.ink);

      if (!document.getElementById('parslia-brand-overrides')) {
        var style = document.createElement('style');
        style.id = 'parslia-brand-overrides';
        style.textContent = [
          ':root{--parslia-purple:#4F3066;--parslia-purple-dark:#352044;--parslia-gold:#C6A66F;--parslia-cream:#F8F5FB;}',
          'header.site-hero,.top{background:linear-gradient(145deg,#352044,#4F3066)!important;border-bottom-color:#C6A66F!important;}',
          'button.primary,.btn.primary,.callbtn,.nav a.active,.nav a:hover{background:#4F3066!important;border-color:#4F3066!important;color:#fff!important;}',
          'h1,h2,h3,.sheet h2,.operational-detail summary,.person,.module a{color:#4F3066!important;}',
          '.progress span{background:linear-gradient(90deg,#4F3066,#C6A66F)!important;}',
          '.chapter-rail,.nav{background:rgba(248,245,251,.95)!important;}',
          '.sheet,.card,.module,.hero-card{border-color:#E4DCE8!important;}',
          '.brand .mark,.mark{color:#4F3066!important;}',
          '.vedanta-brand-strip{display:flex;align-items:center;gap:14px;margin:0 0 20px;padding:12px 14px;border:1px solid rgba(198,166,111,.45);border-radius:14px;background:rgba(255,255,255,.06);width:max-content;max-width:100%;}',
          '.vedanta-brand-strip img{width:68px;height:52px;object-fit:contain;filter:brightness(0) invert(1);}',
          '.vedanta-brand-strip strong{display:block;font:600 24px/1.05 "Cormorant Garamond",Georgia,serif;color:#fff;}',
          '.vedanta-brand-strip span{display:block;margin-top:3px;color:#C6A66F;font-size:10px;letter-spacing:.18em;text-transform:uppercase;}',
          '.feedback-note{margin:18px 0;padding:16px 18px;border:1px solid #E1D3E8;border-left:4px solid #4F3066;border-radius:12px;background:#FBF8FD;}',
          '.feedback-note strong{color:#4F3066;}',
          '.sheet-figure img{width:100%!important;max-width:none!important;max-height:420px!important;object-fit:cover!important;}',
          '@media(max-width:700px){.vedanta-brand-strip{width:100%}.vedanta-brand-strip strong{font-size:20px;}}'
        ].join('');
        document.head.appendChild(style);
      }
    } catch (e) {}
  }

  function normaliseText(s) {
    return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function findHeading(text) {
    var target = normaliseText(text);
    var nodes = document.querySelectorAll('h1,h2,h3,h4,strong');
    for (var i = 0; i < nodes.length; i++) {
      if (normaliseText(nodes[i].textContent) === target) return nodes[i];
    }
    return null;
  }

  function setFollowingParagraph(headingText, newText) {
    var h = findHeading(headingText);
    if (!h) return;
    var p = h.nextElementSibling;
    if (p && p.tagName && p.tagName.toLowerCase() === 'p') p.textContent = newText;
  }

  function addVedantaBrandStrip() {
    if (document.querySelector('.vedanta-brand-strip')) return;
    var hero = document.querySelector('header.site-hero .hero-inner, header.site-hero, .topin');
    if (!hero) return;
    var box = document.createElement('div');
    box.className = 'vedanta-brand-strip';
    box.innerHTML = '<img src="https://static.wixstatic.com/media/e5ce38_508f2b22847a4ac0a965b30d2abf07b9~mv2.png" alt="The Vedanta logo"><div><strong>The Vedanta Way</strong><span>Retreat Centre · Parslia Kitchen OS</span></div>';
    hero.insertBefore(box, hero.firstChild);
  }

  function patchVegetarianWording() {
    var all = document.querySelectorAll('p,.sub,.hero-copy,small');
    for (var i = 0; i < all.length; i++) {
      var t = all[i].textContent || '';
      if (/plant-based service/i.test(t) && !/vegetarian\s*\/\s*plant-based/i.test(t)) {
        all[i].textContent = t.replace(/plant-based service/ig, 'vegetarian / plant-based service');
      }
    }
  }

  function patchSafetyWording() {
    setFollowingParagraph('Slips, trips and spills', 'Clean spills immediately and keep floors dry. After mopping, dry the floor or use a wet-floor sign. Keep walkways clear, wear non-slip footwear, and report leaks or damaged flooring.');
    setFollowingParagraph('Knives and blades', 'Only use knives and blades if trained. Keep knives sharp, use a stable board, carry point-down, never leave them in sinks, and store them safely. Wear cut-resistant gloves when handling Robot-Coupe discs and blades.');
    setFollowingParagraph('Heat, steam and oil', 'Use oven gloves when handling Rational ovens and hot pans. Never add water to fryer oil. Allow J10/N fryer oil to cool below 55°C before draining, and stand clear when tilting the bratt pan.');
    setFollowingParagraph('Gas appliances', 'Know the gas isolation cock and keep extraction and flues clear. If you smell gas, do not operate electrical switches. If safe, ventilate and isolate the gas, evacuate, and contact the appropriate emergency service or engineer. See HSE CAIS23.');
    setFollowingParagraph('Chemicals (COSHH)', 'Read the SDS for each chemical and follow its PPE requirements. Never mix products. Use dosing systems where fitted and store chemicals away from food and food-contact areas.');
    setFollowingParagraph('PPE and reporting', 'Wear required PPE, including an apron, hat/hair restraint and covered non-slip footwear. Report hazards promptly and know the locations of first-aid equipment, fire points and emergency exits.');
  }

  function addGuidanceNote() {
    if (document.getElementById('extra-hse-guidance')) return;
    var anchor = findHeading('PPE and reporting') || findHeading('Safety First') || document.querySelector('.sheet');
    if (!anchor) return;
    var host = anchor.closest('.sheet') || anchor.parentElement;
    if (!host) return;
    var note = document.createElement('div');
    note.className = 'feedback-note';
    note.id = 'extra-hse-guidance';
    note.innerHTML = '<strong>Additional HSE guidance included in the training structure</strong><br>Manual handling — CAIS24 · Kitchen ventilation — CAIS10 · Equipment maintenance priorities — CAIS12 · Skin and hand protection / contact dermatitis — HSE catering guidance.';
    host.appendChild(note);
  }

  function patchSupplierName() {
    var nodes = document.querySelectorAll('h1,h2,h3,h4,strong,b');
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].textContent || '').trim();
      if (/^Sylvester Keal$/i.test(t)) nodes[i].textContent = 'Sylvester Keal (SK)';
    }
  }

  function addOrientationNotice() {
    if (document.getElementById('orientation-map-note')) return;
    var safetyImg = document.querySelector('img[alt*="fire point" i],img[src*="figure-safety-fire"]');
    if (!safetyImg) return;
    var figure = safetyImg.closest('figure') || safetyImg.parentElement;
    if (!figure || !figure.parentElement) return;
    var note = document.createElement('div');
    note.id = 'orientation-map-note';
    note.className = 'feedback-note';
    note.innerHTML = '<strong>Kitchen orientation</strong><br>This safety image is now displayed wider for easier recognition. A full kitchen floorplan and ingredient/equipment storage map require the approved floorplan/location source files before they can be added accurately.';
    figure.parentElement.insertBefore(note, figure.nextSibling);
  }

  function reorderChapterRail() {
    var nav = document.querySelector('.chapter-nav');
    if (!nav) return;
    var items = Array.prototype.slice.call(nav.children);
    if (!items.length) return;
    var order = [
      'safety','emergency','dry store','fridge','freezer','food safety','rational','robot','thermomix','lincat','bratt','blast chiller','induction','chemical','3ab','3l sink','daily','machine','rinse','de-stain','knife','mandoline','order','repair','form','record'
    ];
    function rank(el) {
      var t = normaliseText(el.textContent);
      for (var i = 0; i < order.length; i++) if (t.indexOf(order[i]) !== -1) return i;
      return 999;
    }
    items.sort(function(a,b){return rank(a)-rank(b);});
    for (var i = 0; i < items.length; i++) nav.appendChild(items[i]);
  }

  function patchSopPage() {
    if (!/kitchen-sop-pack/i.test(location.pathname)) return;
    addVedantaBrandStrip();
    patchVegetarianWording();
    patchSafetyWording();
    addGuidanceNote();
    patchSupplierName();
    addOrientationNotice();
    reorderChapterRail();
  }

  function run(opts) {
    opts = opts || {};
    applySharedBranding();
    patchSopPage();

    var skipAuth = opts.skipAuth || document.body.getAttribute('data-parslia-public') === '1';
    if (global.ParsliaAuth) {
      global.ParsliaAuth.init();
      if (!skipAuth) global.ParsliaAuth.requireAuth(opts.next);
      var mount = function () { try { global.ParsliaAuth.mountUserChip(opts); } catch (e) {} };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
    }
    if (global.ParsliaActivity && !skipAuth) {
      var track = function () {
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
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', track); else track();
    }
  }

  global.ParsliaGate = { run: run };

  document.addEventListener('DOMContentLoaded', function () {
    applySharedBranding();
    patchSopPage();
    if (document.body && document.body.getAttribute('data-parslia-public') === '1') return;
    if (document.body && document.body.getAttribute('data-parslia-autogate') === '0') return;
    run();
  });
})(typeof window !== 'undefined' ? window : this);
