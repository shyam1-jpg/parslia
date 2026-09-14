/** Parslia shared gate + branding + SOP presentation fixes. */
(function(global){
'use strict';
var BRAND={purple:'#4F3066',purpleDark:'#352044',purpleLight:'#7A61AD',gold:'#C6A66F',goldSoft:'#EADCC3',cream:'#F8F5FB',paper:'#FFFDF9',ink:'#2B1E3A'};
function normaliseText(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase()}
function findHeading(text){var t=normaliseText(text),n=document.querySelectorAll('h1,h2,h3,h4,strong');for(var i=0;i<n.length;i++)if(normaliseText(n[i].textContent)===t)return n[i];return null}
function setFollowingParagraph(h,newText){var n=findHeading(h);if(!n)return;var p=n.nextElementSibling;if(p&&p.tagName&&p.tagName.toLowerCase()==='p')p.textContent=newText}
function applySharedBranding(){
 try{
  var r=document.documentElement;
  r.style.setProperty('--forest',BRAND.purple);r.style.setProperty('--forest2',BRAND.purpleDark);r.style.setProperty('--forest-deep',BRAND.purpleDark);r.style.setProperty('--gold',BRAND.gold);r.style.setProperty('--gold-soft',BRAND.goldSoft);r.style.setProperty('--paper',BRAND.cream);r.style.setProperty('--ivory',BRAND.cream);r.style.setProperty('--ink',BRAND.ink);
  if(!document.getElementById('parslia-brand-overrides')){
   var s=document.createElement('style');s.id='parslia-brand-overrides';s.textContent=[
   ':root{--parslia-purple:#4F3066;--parslia-purple-dark:#352044;--parslia-gold:#C6A66F;--parslia-cream:#F8F5FB;}',
   'header.site-hero,.top{background:linear-gradient(145deg,#352044,#4F3066)!important;border-bottom-color:#C6A66F!important;}',
   'button.primary,.btn.primary,.callbtn,.nav a.active,.nav a:hover{background:#4F3066!important;border-color:#4F3066!important;color:#fff!important;}',
   'h1,h2,h3,.sheet h2,.operational-detail summary,.person,.module a{color:#4F3066!important;}',
   '.progress span{background:linear-gradient(90deg,#4F3066,#C6A66F)!important;}',
   '.chapter-rail,.nav{background:rgba(248,245,251,.97)!important;}',
   '.sheet,.card,.module,.hero-card{border-color:#E4DCE8!important;}',
   '.brand .mark,.mark{color:#4F3066!important;}',
   '.vedanta-brand-strip{display:flex;align-items:center;gap:12px;margin:0 0 18px;padding:9px 12px;border:1px solid rgba(198,166,111,.5);border-radius:14px;background:rgba(255,255,255,.07);width:max-content;max-width:100%;}',
   '.vedanta-brand-strip img{width:50px;height:40px;object-fit:contain;background:#fff;border-radius:8px;padding:3px;filter:none!important;}',
   '.vedanta-brand-strip strong{display:block;font:600 22px/1.05 "Cormorant Garamond",Georgia,serif;color:#fff!important;}',
   '.vedanta-brand-strip span{display:block;margin-top:3px;color:#C6A66F;font-size:9px;letter-spacing:.16em;text-transform:uppercase;}',
   '.feedback-note{margin:18px 0;padding:15px 17px;border:1px solid #E1D3E8;border-left:4px solid #4F3066;border-radius:12px;background:#FBF8FD;}',
   '.feedback-note strong{color:#4F3066;}',
   '.sheet-figure img{width:100%!important;max-width:none!important;max-height:380px!important;object-fit:cover!important;}',
   'body.parslia-sop-clean{background:linear-gradient(180deg,#F2EDF5 0,#F8F5FB 300px,#F8F5FB 100%)!important;}',
   'body.parslia-sop-clean header.site-hero{padding:28px 24px 24px!important;}',
   'body.parslia-sop-clean header.site-hero h1{max-width:none!important;font-size:clamp(31px,4vw,44px)!important;line-height:1.04!important;}',
   'body.parslia-sop-clean header.site-hero .sub{max-width:760px!important;font-size:15px!important;line-height:1.5!important;color:rgba(255,255,255,.8)!important;}',
   'body.parslia-sop-clean .hero-chips{gap:6px!important;margin-top:15px!important;}',
   'body.parslia-sop-clean .hero-chips .chip{padding:6px 9px!important;min-height:30px!important;font-size:10px!important;}',
   'body.parslia-sop-clean .wrap{max-width:1180px!important;padding:20px 22px 90px!important;}',
   'body.parslia-sop-clean .chapter-rail{position:sticky!important;top:0!important;z-index:60!important;margin:0 -22px 20px!important;padding:10px 22px!important;box-shadow:0 8px 24px rgba(53,32,68,.07)!important;}',
   'body.parslia-sop-clean .chapter-nav{display:flex!important;flex-wrap:nowrap!important;gap:7px!important;overflow-x:auto!important;padding-bottom:3px!important;scrollbar-width:thin!important;}',
   'body.parslia-sop-clean .chapter-nav a{flex:0 0 auto!important;background:#fff!important;border:1px solid #E1D7E6!important;color:#4F3066!important;box-shadow:none!important;padding:9px 12px!important;min-height:38px!important;font-size:12px!important;font-weight:600!important;}',
   'body.parslia-sop-clean .chapter-nav a:hover{background:#4F3066!important;color:#fff!important;border-color:#4F3066!important;}',
   'body.parslia-sop-clean .sheet{background:#fff!important;border:1px solid #E4DCE8!important;border-top:4px solid #4F3066!important;border-radius:18px!important;box-shadow:0 8px 30px rgba(53,32,68,.06)!important;margin:20px 0!important;padding:26px!important;}',
   'body.parslia-sop-clean .sheet::before{background:#C6A66F!important;}',
   'body.parslia-sop-clean .sheet h2{font-size:clamp(25px,3vw,34px)!important;margin-bottom:4px!important;}',
   'body.parslia-sop-clean .sheet-meta{margin:10px 0 16px!important;gap:6px!important;}',
   'body.parslia-sop-clean .sheet-meta span{background:#F8F5FB!important;border-color:#E4DCE8!important;padding:5px 8px!important;}',
   'body.parslia-sop-clean .sheet-main>ol>li,body.parslia-sop-clean .sheet>ol>li{padding-top:14px!important;padding-bottom:14px!important;}',
   'body.parslia-sop-clean .card{border-radius:16px!important;box-shadow:0 5px 20px rgba(53,32,68,.05)!important;}',
   'body.parslia-sop-clean .book-nav{border-top:2px solid #C6A66F!important;background:#fff!important;}',
   'body.parslia-sop-clean .operational-detail{background:#FBF9FC!important;border-color:#E4DCE8!important;}',
   'body.parslia-sop-clean .sop-visual-guide{background:#FBF9FC!important;border-color:#E4DCE8!important;}',
   'body.parslia-sop-clean table{font-size:14px!important;}',
   'body.parslia-sop-clean th{background:#F7F2F9!important;}',
   '.parslia-section-index{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 20px;}',
   '.parslia-section-index a{display:block;text-decoration:none;background:#fff;border:1px solid #E4DCE8;border-radius:14px;padding:13px 14px;color:#4F3066;font-weight:700;box-shadow:0 3px 14px rgba(53,32,68,.04);}',
   '.parslia-section-index a small{display:block;color:#7A7180;font-weight:400;margin-top:3px;}',
   '@media(max-width:900px){.parslia-section-index{grid-template-columns:repeat(2,minmax(0,1fr));}}',
   '@media(max-width:700px){.vedanta-brand-strip{width:100%}.vedanta-brand-strip strong{font-size:19px}body.parslia-sop-clean .wrap{padding-left:12px!important;padding-right:12px!important}body.parslia-sop-clean .chapter-rail{margin-left:-12px!important;margin-right:-12px!important;padding-left:12px!important;padding-right:12px!important}body.parslia-sop-clean .sheet{padding:18px!important}.parslia-section-index{grid-template-columns:1fr;}}'
   ].join('');document.head.appendChild(s);
  }
 }catch(e){}
}
function addVedantaBrandStrip(){if(document.querySelector('.vedanta-brand-strip'))return;var hero=document.querySelector('header.site-hero .hero-inner,header.site-hero,.topin');if(!hero)return;var b=document.createElement('div');b.className='vedanta-brand-strip';b.innerHTML='<img src="https://static.wixstatic.com/media/e5ce38_508f2b22847a4ac0a965b30d2abf07b9~mv2.png" alt="The Vedanta logo"><div><strong>The Vedanta Way</strong><span>Retreat Centre · Parslia Kitchen OS</span></div>';hero.insertBefore(b,hero.firstChild)}
function patchVegetarianWording(){var a=document.querySelectorAll('p,.sub,.hero-copy,small');for(var i=0;i<a.length;i++){var t=a[i].textContent||'';if(/plant-based service/i.test(t)&&!/vegetarian\s*\/\s*plant-based/i.test(t))a[i].textContent=t.replace(/plant-based service/ig,'vegetarian / plant-based service')}}
function patchSafetyWording(){setFollowingParagraph('Slips, trips and spills','Clean spills immediately and keep floors dry. After mopping, dry the floor or use a wet-floor sign. Keep walkways clear, wear non-slip footwear, and report leaks or damaged flooring.');setFollowingParagraph('Knives and blades','Only use knives and blades if trained. Keep knives sharp, use a stable board, carry point-down, never leave them in sinks, and store them safely. Wear cut-resistant gloves when handling Robot-Coupe discs and blades.');setFollowingParagraph('Heat, steam and oil','Use oven gloves when handling Rational ovens and hot pans. Never add water to fryer oil. Allow J10/N fryer oil to cool below 55°C before draining, and stand clear when tilting the bratt pan.');setFollowingParagraph('Gas appliances','Know the gas isolation cock and keep extraction and flues clear. If you smell gas, do not operate electrical switches. If safe, ventilate and isolate the gas, evacuate, and contact the appropriate emergency service or engineer. See HSE CAIS23.');setFollowingParagraph('Chemicals (COSHH)','Read the SDS for each chemical and follow its PPE requirements. Never mix products. Use dosing systems where fitted and store chemicals away from food and food-contact areas.');setFollowingParagraph('PPE and reporting','Wear required PPE, including an apron, hat/hair restraint and covered non-slip footwear. Report hazards promptly and know the locations of first-aid equipment, fire points and emergency exits.')}
function addGuidanceNote(){if(document.getElementById('extra-hse-guidance'))return;var a=findHeading('PPE and reporting')||findHeading('Safety First')||document.querySelector('.sheet');if(!a)return;var h=a.closest('.sheet')||a.parentElement;if(!h)return;var n=document.createElement('div');n.className='feedback-note';n.id='extra-hse-guidance';n.innerHTML='<strong>Additional HSE guidance</strong><br>Manual handling — CAIS24 · Kitchen ventilation — CAIS10 · Equipment maintenance priorities — CAIS12 · Skin and hand protection / contact dermatitis — HSE catering guidance.';h.appendChild(n)}
function patchSupplierName(){var n=document.querySelectorAll('h1,h2,h3,h4,strong,b');for(var i=0;i<n.length;i++)if(/^Sylvester Keal$/i.test((n[i].textContent||'').trim()))n[i].textContent='Sylvester Keal (SK)'}
function addOrientationNotice(){if(document.getElementById('orientation-map-note'))return;var img=document.querySelector('img[alt*="fire point" i],img[src*="figure-safety-fire"]');if(!img)return;var f=img.closest('figure')||img.parentElement;if(!f||!f.parentElement)return;var n=document.createElement('div');n.id='orientation-map-note';n.className='feedback-note';n.innerHTML='<strong>Kitchen orientation</strong><br>A wider safety image is shown for recognition. The full floorplan and ingredient/equipment storage map can be added once the approved source plan is available.';f.parentElement.insertBefore(n,f.nextSibling)}
function reorderChapterRail(){var nav=document.querySelector('.chapter-nav');if(!nav)return;var items=[].slice.call(nav.children),order=['safety','emergency','dry store','fridge','freezer','food safety','rational','robot','thermomix','lincat','bratt','blast chiller','induction','chemical','3ab','3l sink','daily','machine','rinse','de-stain','knife','mandoline','order','repair','form','record'];function rank(e){var t=normaliseText(e.textContent);for(var i=0;i<order.length;i++)if(t.indexOf(order[i])!==-1)return i;return 999}items.sort(function(a,b){return rank(a)-rank(b)});for(var i=0;i<items.length;i++)nav.appendChild(items[i])}
function removeLeakedCode(){
 try{var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);var kill=[];while(w.nextNode()){var t=w.currentNode.nodeValue||'';if((t.indexOf("doc.close();")!==-1&&t.indexOf('function csv(id)')!==-1)||t.indexOf("const safe=v=>")!==-1)kill.push(w.currentNode)}for(var i=0;i<kill.length;i++)kill[i].nodeValue='';}catch(e){}
}
function addSectionIndex(){
 if(document.querySelector('.parslia-section-index'))return;var rail=document.querySelector('.chapter-rail');if(!rail)return;var wrap=rail.parentElement||document.querySelector('.wrap');if(!wrap)return;var box=document.createElement('div');box.className='parslia-section-index';box.innerHTML='<a href="#SAFETY">0 · Safety First<small>Core safety, PPE, manual handling</small></a><a href="#EMERGENCY">1 · Emergencies<small>Fire, first aid, incident response</small></a><a href="#STORAGE">2 · Kitchen & Storage<small>Dry store, fridge, freezer, temperatures</small></a><a href="#EQUIPMENT">3 · Equipment<small>Operation and safe use</small></a><a href="#CLEANING">4 · Cleaning & Chemicals<small>COSHH, daily and machine cleaning</small></a><a href="#KNIVES">5 · Knives & Small Equipment<small>Safe handling and storage</small></a><a href="#ORDERING">6 · Ordering & Repairs<small>Faults, maintenance, supplies</small></a><a href="#FORMS">7 · Forms & Records<small>Checklists, logs and documentation</small></a>';
 rail.parentElement.insertBefore(box,rail.nextSibling);
}
function patchSopPage(){if(!/kitchen-sop-pack/i.test(location.pathname))return;document.body.classList.add('parslia-sop-clean');removeLeakedCode();addVedantaBrandStrip();patchVegetarianWording();patchSafetyWording();addGuidanceNote();patchSupplierName();addOrientationNotice();reorderChapterRail();addSectionIndex()}
function run(opts){opts=opts||{};applySharedBranding();patchSopPage();var skip=opts.skipAuth||document.body.getAttribute('data-parslia-public')==='1';if(global.ParsliaAuth){global.ParsliaAuth.init();if(!skip)global.ParsliaAuth.requireAuth(opts.next);var m=function(){try{global.ParsliaAuth.mountUserChip(opts)}catch(e){}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',m);else m()}if(global.ParsliaActivity&&!skip){var track=function(){var tries=0;function tick(){tries++;if((global.ParsliaAuth&&global.ParsliaAuth.getUser&&global.ParsliaAuth.getUser())||tries>40){try{global.ParsliaActivity.trackPage()}catch(e){};return}setTimeout(tick,100)}tick()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',track);else track()}}
global.ParsliaGate={run:run};document.addEventListener('DOMContentLoaded',function(){applySharedBranding();patchSopPage();if(document.body&&document.body.getAttribute('data-parslia-public')==='1')return;if(document.body&&document.body.getAttribute('data-parslia-autogate')==='0')return;run()});
})(typeof window!=='undefined'?window:this);
