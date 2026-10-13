(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.KilnGenerator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var runtimeCache = '';

  var PALETTES = {
    sea: { bg: '#f3f6f4', ink: '#14221c', sidebar: '#16332b', accent: '#1f7a63', card: '#ffffff', line: '#d5e0da', muted: '#5c6f68' },
    honey: { bg: '#fbf6ec', ink: '#2a2116', sidebar: '#3a2a16', accent: '#c4841d', card: '#fffdf8', line: '#eadcba', muted: '#74685a' },
    copper: { bg: '#f7f3ee', ink: '#1c1714', sidebar: '#2a211c', accent: '#c4622d', card: '#fffdfb', line: '#e6ddd4', muted: '#6e645c' },
    ink: { bg: '#f4f5f7', ink: '#16181d', sidebar: '#1c2430', accent: '#2f5f9e', card: '#ffffff', line: '#dde2ea', muted: '#5d6673' },
    rose: { bg: '#fbf4f4', ink: '#241618', sidebar: '#3a2226', accent: '#a84560', card: '#fffdfd', line: '#eddde0', muted: '#735c62' },
    leaf: { bg: '#f3f6f1', ink: '#172016', sidebar: '#1d2b1c', accent: '#3d7a45', card: '#ffffff', line: '#d7e2d4', muted: '#5c6b5a' }
  };

  var GENRES = [
    [/\b(clinic|patient|dentist|hospital|\bgp\b)\b/i, ['Patients', 'Appointments']],
    [/\b(school|classroom)\b/i, ['Students', 'Lessons', 'Assignments']],
    [/\b(restaurant|cafe|café|coffee shop)\b/i, ['Tables', 'Orders', 'Menu items']],
    [/\b(gym|workout|fitness)\b/i, ['Workouts', 'Members']],
    [/\b(church|mosque|temple|parish)\b/i, ['Services', 'Volunteers']],
    [/\bdog walk/i, ['Clients', 'Dogs', 'Walks']],
    [/\b(real estate|propert(?:y|ies))\b/i, ['Properties', 'Viewings', 'Clients']],
    [/\b(game|scoreboard)\b/i, ['Players', 'Scores']],
    [/\b(podcast|newsletter)\b/i, ['Issues', 'Ideas']],
    [/\b(todo|tasks?|task list)\b/i, ['Tasks']],
    [/\bhabits?\b/i, ['Habits']],
    [/\brecipes?\b/i, ['Recipes']],
    [/\b(inventory|stocktake|stock)\b/i, ['Stock']],
    [/\b(chat|messages|inbox)\b/i, ['Messages']],
    [/\b(blog|journal|diary)\b/i, ['Entries']],
    [/\b(booking|appointments?|reservations?)\b/i, ['Appointments']],
    [/\binvoices?\b/i, ['Invoices', 'Clients']],
    [/\b(crm|client tracker)\b/i, ['Clients', 'Jobs']]
  ];

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function safeJson(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }

  function titleCase(value) {
    return String(value || '').split(/\s+/).filter(Boolean).map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  function slugify(value) {
    var slug = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug || 'app';
  }

  function singular(phrase) {
    var parts = String(phrase || '').trim().split(/\s+/);
    var last = parts[parts.length - 1] || '';
    if (/ies$/i.test(last) && last.length > 4) parts[parts.length - 1] = last.slice(0, -3) + 'y';
    else if (/(ches|shes|xes|zes|ses)$/i.test(last)) parts[parts.length - 1] = last.replace(/es$/i, '');
    else if (/s$/i.test(last) && !/ss$/i.test(last) && last.length > 3) parts[parts.length - 1] = last.slice(0, -1);
    return parts.join(' ');
  }

  function cleanSubject(phrase) {
    var text = String(phrase || '').trim();
    text = text.split(/\b(?:with|that|selling|about)\b/i)[0].trim();
    text = text.replace(/^(catalogu\w*|track(?:ing)?|log(?:ging)?|manag\w*|record(?:ing)?|organis\w*|organiz\w*|build\w*|creat\w*|mak\w*)\s+/i, '');
    text = text.replace(/\s+in\s+[a-z][a-z-]{1,24}(?:\s+[a-z][a-z-]{1,24})?$/i, '');
    text = text.replace(/^(a|an|the|my|our)\s+/i, '');
    text = text.replace(/[.,;:]+$/g, '').trim();
    if (!text || /^(app|website|business|something|anything|amazing)$/i.test(text)) return '';
    var words = text.split(/\s+/);
    if (words.length > 6) text = words.slice(0, 6).join(' ');
    return text;
  }

  function splitList(chunk) {
    return String(chunk || '')
      .replace(/\b(and|or)\b/gi, ',')
      .split(',')
      .map(function (part) { return part.replace(/^(a|an|the|my|our)\s+/i, '').trim(); })
      .map(function (part) { return part.replace(/[.?!].*$/, '').trim(); })
      .filter(function (part) { return part && part.length < 48 && part.split(/\s+/).length <= 6; })
      .filter(function (part) {
        return !/^(app|website|business|system|tool|software|people|anyone|world|subscription|it|them)$/i.test(part);
      });
  }

  function extractList(text, shop, quiz) {
    var selling = text.match(/\b(?:selling|sells|sell)\s+(.+)$/i);
    if (selling) return { mode: 'products', items: splitList(selling[1]) };
    if (quiz && !/\b(log|track|manage|record)\b/i.test(text)) return { mode: 'none', items: [] };
    var verb = text.match(/\b(?:log|track|manage|record)\s+(.+)$/i);
    if (verb && /,|\band\b/i.test(verb[1])) return { mode: shop ? 'products' : 'records', items: splitList(verb[1]) };
    var withList = text.match(/\bwith\s+(.+)$/i);
    if (withList && /,|\band\b/i.test(withList[1])) return { mode: shop ? 'products' : 'records', items: splitList(withList[1]) };
    var colon = text.match(/:\s*([a-z0-9].+)$/i);
    if (colon && /,|\band\b/i.test(colon[1])) return { mode: shop ? 'products' : 'records', items: splitList(colon[1]) };
    return { mode: 'none', items: [] };
  }

  function subjectPhrase(text) {
    var match = text.match(/\b(?:catalogu\w*|track(?:ing)?|log(?:ging)?|manag\w*|record(?:ing)?)\s+([a-z0-9][^.\n]{2,80})/i);
    if (!match) return '';
    return cleanSubject(match[1]);
  }

  function extractFor(text) {
    var match = text.match(/\bfor\s+(?:a |an |my |the )?([a-z0-9][^.\n]{1,80})/i);
    if (!match) return '';
    return cleanSubject(match[1]);
  }

  function genreNames(text) {
    for (var i = 0; i < GENRES.length; i += 1) {
      if (GENRES[i][0].test(text)) return GENRES[i][1].slice();
    }
    return null;
  }

  function paletteFor(text) {
    if (/sea|lighthouse|boat|ocean|fish|harbour|harbor|island/i.test(text)) return PALETTES.sea;
    if (/bee|honey|bread|bakery|food|candle|coffee|pizza|kitchen/i.test(text)) return PALETTES.honey;
    if (/law|finance|clinic|school|science|account/i.test(text)) return PALETTES.ink;
    if (/beauty|flower|wedding|salon/i.test(text)) return PALETTES.rose;
    if (/garden|farm|plant|dog|yoga|fitness/i.test(text)) return PALETTES.leaf;
    var keys = Object.keys(PALETTES);
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    return PALETTES[keys[hash % keys.length]];
  }

  function statusesFor(name) {
    var local = name.toLowerCase();
    if (/invoice|quote|payment|order/.test(local)) return ['Unpaid', 'Paid'];
    if (/inspection|test|check|weather|harvest/.test(local)) return ['OK', 'Needs attention'];
    return ['Open', 'Done'];
  }

  function fieldsFor(raw) {
    var local = String(raw || '').toLowerCase();
    if (/enquir|contact form|contact/.test(local)) {
      return [
        { id: 'title', label: 'Name', type: 'text' },
        { id: 'email', label: 'Email', type: 'email' },
        { id: 'phone', label: 'Phone', type: 'phone' },
        { id: 'notes', label: 'Message', type: 'long' }
      ];
    }
    var fields = [{ id: 'title', label: 'Name', type: 'text' }];
    function add(id, label, type, options) {
      if (fields.some(function (field) { return field.id === id; })) return;
      if (fields.length >= 5) return;
      var field = { id: id, label: label, type: type };
      if (options) field.options = options;
      fields.push(field);
    }
    if (/date|inspection|harvest|weather|rota|service|walk|appointment|test|schedule|boat|job|class|lesson/.test(local)) add('when', 'Date', 'date');
    if (/time|appointment|rota|schedule|class|walk/.test(local)) add('time', 'Time', 'time');
    if (/oil|qty|quantity|weight|harvest|litre|liter|fuel|stock|supply/.test(local)) add('qty', 'Quantity', 'number');
    if (/weather|fog|storm/.test(local)) add('condition', 'Condition', 'select', ['Clear', 'Fog', 'Rain', 'Wind', 'Storm', 'Snow']);
    if (/price|cost|invoice|quote|fee|pay|order|job/.test(local)) add('amount', 'Amount', 'money');
    if (/client|customer|volunteer|patient|owner|member|dog/.test(local)) {
      add('phone', 'Phone', 'phone');
      add('email', 'Email', 'email');
    }
    if (/dog/.test(local)) add('breed', 'Breed', 'text');
    if (/rota|volunteer|serving|assigned|walk|job/.test(local)) add('who', 'Who', 'text');
    if (/boat|supply|location|address|place|property|hive/.test(local)) add('where', 'Location', 'location');
    if (!fields.some(function (field) { return field.id === 'notes'; })) fields.push({ id: 'notes', label: 'Notes', type: 'long' });
    return fields;
  }

  function uniqueId(used, base) {
    var id = base || 'item';
    if (!used[id]) {
      used[id] = 1;
      return id;
    }
    used[id] += 1;
    return id + '-' + used[id];
  }

  function makeCollection(raw, used) {
    var name = titleCase(String(raw || '').trim());
    return {
      id: uniqueId(used, slugify(name)),
      name: name,
      singular: titleCase(singular(raw)),
      statuses: statusesFor(raw),
      fields: fieldsFor(raw)
    };
  }

  function ordersCollection(used) {
    return {
      id: uniqueId(used, 'orders'),
      name: 'Orders',
      singular: 'Order',
      statuses: ['New', 'Packed', 'Done'],
      fields: [
        { id: 'title', label: 'Customer', type: 'text' },
        { id: 'items', label: 'Items', type: 'text' },
        { id: 'amount', label: 'Total', type: 'money' },
        { id: 'notes', label: 'Notes', type: 'long' }
      ]
    };
  }

  function toProduct(raw, index, used) {
    var priceMatch = String(raw).match(/[£$](\d+(?:\.\d{1,2})?)/);
    var name = titleCase(String(raw).replace(/[£$]\d+(?:\.\d{1,2})?/g, '').replace(/\b(at|for)\b/gi, '').trim());
    return {
      id: uniqueId(used, slugify(name) || 'item'),
      name: name || ('Item ' + (index + 1)),
      price: priceMatch ? Number(priceMatch[1]) : 12 + index * 4,
      sample: !priceMatch
    };
  }

  function appName(text) {
    var quoted = text.match(/["“]([^"”]{2,60})["”]/);
    if (quoted) return titleCase(quoted[1].trim()).slice(0, 48);
    var called = text.match(/\b(?:called|named)\s+([a-z0-9][a-z0-9 '&-]{1,48})/i);
    if (called) return titleCase(called[1].trim()).slice(0, 48);
    var prefix = text.match(/^(?:please\s+)?(?:build\s+)?(?:an?\s+|my\s+)?(.+?)\s+app\b/i);
    if (prefix) {
      var bit = titleCase(prefix[1].replace(/^(simple|new|online|mobile|web|a|an|the|my)\s+/i, '').trim());
      if (bit && !/^(quiz|shop|store|booking|tracker|calculator|website|landing|client tracker|a|an|the|my)$/i.test(bit)) {
        return bit.slice(0, 48);
      }
    }
    var forPhrase = extractFor(text);
    if (forPhrase) return titleCase(forPhrase).slice(0, 48);
    return '';
  }

  function quizTopic(text, name) {
    var about = text.match(/\babout\s+([a-z0-9][^.]{2,48})/i);
    if (!about) return name;
    return titleCase(about[1].split(/\bwith\b/i)[0].trim()).slice(0, 48);
  }

  function isEnquiry(name) {
    return /contact form|enquir|enquiry|inquiry/i.test(name);
  }

  function parsePrompt(raw) {
    var text = String(raw || '').replace(/\s+/g, ' ').trim();
    var shop = /\b(shop|store|sell|selling|boutique|products?)\b/i.test(text);
    var auth = /\b(log[\s-]?in|sign[\s-]?in|password|members?|roles?|accounts?|authentication|users)\b/i.test(text);
    var quiz = /\b(quiz|trivia|flash\s*cards?)\b/i.test(text);
    var calculator = /\b(calculator|costing|estimate)\b/i.test(text);
    var tools = [];
    if (/\b(timer|stopwatch|countdown)\b/i.test(text)) tools.push('timer');
    if (/\b(tally|counter|clicker)\b/i.test(text)) tools.push('tally');

    var list = extractList(text, shop, quiz);
    var used = {};
    var products = [];
    var names = [];
    if (list.mode === 'products') products = list.items.map(function (item, index) { return toProduct(item, index, used); });
    else names = list.items.slice();

    if (!names.length && !products.length && !quiz && !calculator) {
      var subject = subjectPhrase(text);
      if (subject) names = [subject];
    }
    if (!names.length && !products.length && !quiz && !calculator && !tools.length) {
      var genre = genreNames(text);
      if (genre) names = genre;
    }

    var named = appName(text);
    var vague = false;
    if (!names.length && !products.length && !quiz && !calculator && !tools.length) {
      if (named) names = [named];
      else {
        names = ['Records'];
        vague = true;
      }
    }

    var collections = [];
    names.forEach(function (item) {
      collections.push(isEnquiry(item) ? makeCollection('Enquiries', used) : makeCollection(item, used));
    });
    if (shop && !collections.some(function (collection) { return collection.id === 'orders' || collection.name === 'Orders'; })) {
      collections.push(ordersCollection(used));
    }
    if (/\b(e-?mails?|inbox)\b/i.test(text) && !collections.some(function (collection) { return collection.name === 'Enquiries'; })) {
      collections.push(makeCollection('Enquiries', used));
    }
    if (/\b(payments?|checkout)\b/i.test(text) && !shop && !collections.some(function (collection) { return /payment|invoice/i.test(collection.name); })) {
      collections.push(makeCollection('Payments', used));
    }

    var name = named || ((collections[0] && collections[0].name !== 'Records') ? collections[0].name : 'New app');
    var pitch = text ? text.charAt(0).toUpperCase() + text.slice(1) : 'A new app.';
    if (pitch.length > 280) pitch = pitch.slice(0, 277) + '...';

    return {
      name: name,
      pitch: pitch,
      slug: slugify(name),
      vague: vague,
      palette: paletteFor(text + ' ' + name),
      collections: collections,
      products: products,
      shop: shop,
      quiz: quiz ? { topic: quizTopic(text, name) } : null,
      calculator: calculator ? { title: name + ' calculator' } : null,
      tools: tools,
      auth: auth,
      source: text.slice(0, 2000)
    };
  }

  function quote(spec, opts) {
    if (opts && opts.revision) return 12;
    if (spec.vague) return 15;
    var cost = 20 + Math.max(0, spec.collections.length - 1) * 8;
    if (spec.shop) cost += 10;
    if (spec.quiz) cost += 10;
    if (spec.calculator) cost += 10;
    if (spec.tools && spec.tools.length) cost += 5;
    if (spec.auth) cost += 5;
    return Math.min(60, cost);
  }

  function screenList(spec) {
    var names = ['Home'].concat(spec.collections.map(function (collection) { return collection.name; }));
    if (spec.auth) names.splice(1, 0, 'Sign in');
    if (spec.shop) names.push('Shop');
    if (spec.quiz) names.push('Quiz');
    if (spec.calculator) names.push('Calculator');
    if (spec.tools.indexOf('timer') >= 0) names.push('Timer');
    if (spec.tools.indexOf('tally') >= 0) names.push('Tally');
    return names;
  }

  function appCss(palette) {
    return [
      ':root{--bg:' + palette.bg + ';--ink:' + palette.ink + ';--sidebar:' + palette.sidebar + ';--accent:' + palette.accent + ';--card:' + palette.card + ';--line:' + palette.line + ';--muted:' + palette.muted + ';}',
      '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 Georgia,"Iowan Old Style",Palatino,serif}',
      'button,input,textarea,select{font:15px/1.4 system-ui,sans-serif}',
      '.shell{display:grid;grid-template-columns:232px 1fr;min-height:100vh}',
      '.side{background:var(--sidebar);color:#f7f4ef;padding:22px 14px;display:flex;flex-direction:column;gap:14px}',
      '.mark{font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.62}',
      '.side h1{font-size:30px;line-height:1;margin:0}',
      '.nav{display:grid;gap:4px}',
      '.nav button{display:block;width:100%;text-align:left;background:transparent;color:inherit;border:0;border-radius:10px;padding:10px 12px;cursor:pointer}',
      '.nav button.on{background:rgba(255,255,255,.14)}',
      '.fine{margin-top:auto;font:12px/1.4 system-ui,sans-serif;opacity:.65}',
      '.main{padding:28px;display:grid;gap:16px;align-content:start}',
      '.main h2{font-size:34px;line-height:1;margin:0}',
      '.pitch{margin:0;max-width:62ch;color:var(--muted);font:16px/1.5 system-ui,sans-serif}',
      '.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}',
      '.stat,.card,form,.panel{background:var(--card);border:1px solid var(--line);border-radius:16px}',
      '.stat{padding:14px 16px;text-align:left;cursor:pointer}.stat b{display:block;font-size:34px;line-height:1}',
      '.stat span,.muted{color:var(--muted);font:13px/1.4 system-ui,sans-serif}',
      'form,.panel{padding:16px;display:grid;gap:10px}',
      'label{display:grid;gap:4px;font:13px/1.3 system-ui,sans-serif;font-weight:700}',
      'input,textarea,select{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink)}',
      'textarea{min-height:84px;resize:vertical}',
      '.primary,.ghost{border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:700}',
      '.primary{background:var(--accent);color:#fff;border:0}',
      '.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}',
      '.side .ghost{color:#f7f4ef;border-color:rgba(255,255,255,.35)}',
      '.fine p{margin:0 0 8px}',
      '.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
      '.list{display:grid;gap:10px}',
      '.card{padding:14px 16px;display:grid;gap:8px}',
      '.card h3{margin:0;font-size:22px}',
      '.pill{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;background:var(--bg);border:1px solid var(--line);font:12px/1 system-ui,sans-serif}',
      '.sample{font:11px/1 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}',
      '.price{font-size:28px}',
      '.search{max-width:320px}',
      '.choice{display:block;text-align:left;width:100%;margin:0}',
      '.big{font-size:72px;line-height:.9}',
      '@media(max-width:760px){.shell{grid-template-columns:1fr}.side{position:sticky;top:0;z-index:2}.nav{display:flex;overflow:auto}.nav button{width:auto;white-space:nowrap}.main{padding:16px}.big{font-size:56px}}'
    ].join('');
  }

  function readRuntime() {
    if (runtimeCache) return runtimeCache;
    if (typeof require === 'function') {
      var fs = require('fs');
      var path = require('path');
      runtimeCache = fs.readFileSync(path.join(__dirname, 'app-runtime.js'), 'utf8');
      return runtimeCache;
    }
    return '';
  }

  function render(spec, runtime) {
    var safeRuntime = String(runtime || '').replace(/<\/script/gi, '<\\/script');
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' +
      esc(spec.name) + '</title>\n<style>\n' + appCss(spec.palette) + '\n</style>\n</head>\n<body>\n<div id="app"></div>\n<script type="application/json" id="kiln-spec">' +
      safeJson(spec) + '</script>\n<script>\n' + safeRuntime + '\n</script>\n</body>\n</html>\n';
  }

  function build(prompt, opts) {
    opts = opts || {};
    var combined = opts.revision && opts.previous ? (opts.previous + '\n' + prompt) : String(prompt || '');
    var spec = parsePrompt(combined);
    if (opts.name) {
      var nextName = String(opts.name).replace(/\s+/g, ' ').trim().slice(0, 48);
      if (nextName) spec.name = nextName;
    }
    if (opts.accent && /^#[0-9a-fA-F]{6}$/.test(opts.accent)) {
      spec.palette = Object.assign({}, spec.palette, { accent: opts.accent });
    }
    spec.mark = opts.whiteLabel ? '' : 'Kiln app';
    var cost = opts.look ? 2 : quote(spec, opts);
    function finish(runtime) {
      return { spec: spec, html: render(spec, runtime), cost: cost, screens: screenList(spec) };
    }
    var runtime = readRuntime();
    if (runtime) return finish(runtime);
    return fetch('js/app-runtime.js', { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('The app runner failed to load.');
      return response.text();
    }).then(function (text) {
      runtimeCache = text;
      return finish(text);
    });
  }

  return { parsePrompt: parsePrompt, quote: quote, screenList: screenList, build: build };
});
