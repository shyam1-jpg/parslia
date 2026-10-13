(function () {
  var specNode = document.getElementById('kiln-spec');
  if (!specNode) return;
  var spec = JSON.parse(specNode.textContent);
  var root = document.getElementById('app');
  var storageKey = 'kiln-made:' + spec.slug;
  var current = 'home';
  var cart = [];
  var editing = null;
  var quizIndex = 0;
  var quizScore = 0;
  var timerLeft = 0;
  var timerId = 0;
  var timerOn = false;

  function load() {
    try {
      var parsed = JSON.parse(localStorage.getItem(storageKey) || '');
      if (!parsed || typeof parsed !== 'object') throw new Error('empty');
      parsed.cols = parsed.cols || {};
      parsed.products = parsed.products || [];
      parsed.questions = parsed.questions || [];
      parsed.users = parsed.users || [];
      parsed.tally = parsed.tally || 0;
      return parsed;
    } catch (err) {
      return {
        cols: {},
        products: [],
        users: [],
        questions: spec.quiz ? [{
          id: 'sample',
          q: 'Sample question about ' + spec.quiz.topic + '. Edit or delete it, then add your own.',
          choices: ['Replace this answer', 'Edit this question', 'Add your own question'],
          answer: 0,
          sample: true
        }] : [],
        tally: 0
      };
    }
  }

  var state = load();

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (err) { /* private browsing */ }
  }

  var sessionKey = storageKey + ':who';
  var sessionEmail = '';

  function sessionUser() {
    if (sessionEmail) return sessionEmail;
    try { return sessionStorage.getItem(sessionKey) || ''; } catch (err) { return ''; }
  }

  function setSession(email) {
    sessionEmail = email;
    try { sessionStorage.setItem(sessionKey, email); } catch (err) { /* preview frames can block storage */ }
  }

  function signOut() {
    sessionEmail = '';
    try { sessionStorage.removeItem(sessionKey); } catch (err) { /* private browsing */ }
    draw();
  }

  function sessionLabel() {
    var email = sessionUser();
    var user = (state.users || []).filter(function (item) { return item.email === email; })[0];
    return email + (user && user.role ? ' · ' + user.role : '');
  }

  function uid() { return Math.random().toString(36).slice(2, 10); }

  function h(tag, props, kids) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (key) {
      if (key === 'class') node.className = props[key];
      else if (key.slice(0, 2) === 'on' && typeof props[key] === 'function') node.addEventListener(key.slice(2), props[key]);
      else if (props[key] != null) node.setAttribute(key, String(props[key]));
    });
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) return;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function collection(id) {
    return spec.collections.filter(function (item) { return item.id === id; })[0] || null;
  }

  function ordersCol() {
    return spec.collections.filter(function (item) {
      return item.id === 'orders' || item.name === 'Orders';
    })[0] || null;
  }

  function rows(id) {
    if (!state.cols[id]) state.cols[id] = [];
    return state.cols[id];
  }

  function allProducts() { return (spec.products || []).concat(state.products || []); }

  function go(id) {
    if (id !== 'timer' && timerId) {
      clearInterval(timerId);
      timerId = 0;
    }
    current = id;
    editing = null;
    draw();
  }

  function navButton(id, label) {
    return h('button', { type: 'button', class: current === id ? 'on' : '', onclick: function () { go(id); } }, [label]);
  }

  function shell() {
    var buttons = [navButton('home', 'Home')];
    spec.collections.forEach(function (item) { buttons.push(navButton(item.id, item.name)); });
    if (spec.shop) buttons.push(navButton('shop', 'Shop'));
    if (spec.quiz) buttons.push(navButton('quiz', 'Quiz'));
    if (spec.calculator) buttons.push(navButton('calculator', 'Calculator'));
    if (spec.tools.indexOf('timer') >= 0) buttons.push(navButton('timer', 'Timer'));
    if (spec.tools.indexOf('tally') >= 0) buttons.push(navButton('tally', 'Tally'));
    root.textContent = '';
    root.appendChild(h('div', { class: 'shell' }, [
      h('aside', { class: 'side' }, [
        h('div', {}, [spec.mark ? h('div', { class: 'mark' }, [spec.mark]) : null, h('h1', {}, [spec.name])]),
        h('nav', { class: 'nav' }, buttons),
        h('div', { class: 'fine' }, [
          spec.auth && sessionUser() ? h('p', {}, [sessionLabel()]) : null,
          h('p', {}, [spec.mark ? 'Saves in this browser. Download the file from Kiln to keep a copy.' : 'Saves in this browser.']),
          spec.auth ? h('button', { class: 'ghost', type: 'button', onclick: function () { signOut(); } }, ['Sign out']) : null
        ])
      ]),
      h('main', { class: 'main', id: 'main' })
    ]));
  }

  function fieldInput(field, value) {
    var currentValue = value == null ? '' : String(value);
    if (field.type === 'long') return h('textarea', { name: field.id }, [currentValue]);
    if (field.type === 'select') {
      return h('select', { name: field.id }, (field.options || []).map(function (option) {
        var node = h('option', { value: option }, [option]);
        if (option === currentValue) node.selected = true;
        return node;
      }));
    }
    var type = field.type === 'money' || field.type === 'number' ? 'number' : field.type === 'phone' ? 'tel' : field.type === 'location' ? 'text' : field.type;
    var input = h('input', { name: field.id, type: type, value: currentValue });
    if (field.type === 'money') input.setAttribute('step', '0.01');
    if (field.type === 'number') input.setAttribute('step', '1');
    return input;
  }

  function recordForm(col) {
    var existing = editing ? rows(col.id).filter(function (row) { return row.id === editing; })[0] : null;
    var values = existing ? existing.values : {};
    return h('form', {
      onsubmit: function (event) {
        event.preventDefault();
        var data = new FormData(event.target);
        var next = {};
        col.fields.forEach(function (field) { next[field.id] = String(data.get(field.id) || '').trim(); });
        if (!next.title) return;
        if (existing) existing.values = next;
        else rows(col.id).unshift({ id: uid(), status: col.statuses[0], values: next, at: Date.now() });
        editing = null;
        save();
        draw();
      }
    }, [
      h('h2', {}, [existing ? 'Edit ' + col.singular.toLowerCase() : 'Add ' + col.singular.toLowerCase()]),
      h('div', { class: 'list' }, col.fields.map(function (field) {
        return h('label', {}, [field.label, fieldInput(field, values[field.id])]);
      })),
      h('div', { class: 'row' }, [
        h('button', { class: 'primary', type: 'submit' }, [existing ? 'Save changes' : 'Save']),
        existing ? h('button', { class: 'ghost', type: 'button', onclick: function () { editing = null; draw(); } }, ['Cancel']) : null
      ])
    ]);
  }

  function recordCard(col, row) {
    return h('article', { class: 'card' }, [
      h('div', { class: 'row' }, [
        h('h3', {}, [row.values.title || 'Untitled']),
        h('span', { class: 'pill' }, [row.status || col.statuses[0]])
      ]),
      h('div', { class: 'muted' }, [col.fields.filter(function (field) {
        return field.id !== 'title' && row.values[field.id];
      }).map(function (field) { return field.label + ': ' + row.values[field.id]; }).join(' · ')]),
      h('div', { class: 'row' }, [
        h('select', { onchange: function (event) { row.status = event.target.value; save(); } }, col.statuses.map(function (status) {
          var option = h('option', { value: status }, [status]);
          if (status === row.status) option.selected = true;
          return option;
        })),
        h('button', { class: 'ghost', type: 'button', onclick: function () { editing = row.id; draw(); } }, ['Edit']),
        h('button', { class: 'ghost', type: 'button', onclick: function () {
          state.cols[col.id] = rows(col.id).filter(function (item) { return item.id !== row.id; });
          save();
          draw();
        } }, ['Delete'])
      ])
    ]);
  }

  function exportCsv(col) {
    var headers = ['Status'].concat(col.fields.map(function (field) { return field.label; }));
    var lines = [headers.join(',')].concat(rows(col.id).map(function (row) {
      return [row.status].concat(col.fields.map(function (field) { return row.values[field.id] || ''; })).map(function (cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(',');
    }));
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = spec.slug + '-' + col.id + '.csv';
    link.click();
  }

  function collectionScreen(col) {
    var query = '';
    var list = h('div', { class: 'list' });
    function drawList() {
      var needle = query.toLowerCase();
      var visible = rows(col.id).filter(function (row) {
        var blob = Object.keys(row.values).map(function (key) { return row.values[key]; }).join(' ').toLowerCase();
        return !needle || blob.indexOf(needle) >= 0;
      });
      list.textContent = '';
      if (!visible.length) list.appendChild(h('p', { class: 'muted' }, ['No ' + col.name.toLowerCase() + ' yet.']));
      visible.forEach(function (row) { list.appendChild(recordCard(col, row)); });
    }
    drawList();
    return h('div', { class: 'list' }, [
      recordForm(col),
      h('div', { class: 'row' }, [
        h('input', { class: 'search', type: 'search', placeholder: 'Search ' + col.name.toLowerCase(), oninput: function (event) {
          query = event.target.value;
          drawList();
        } }),
        h('button', { class: 'ghost', type: 'button', onclick: function () { exportCsv(col); } }, ['Download CSV'])
      ]),
      list
    ]);
  }

  function homeScreen() {
    var recent = [];
    spec.collections.forEach(function (col) {
      rows(col.id).forEach(function (row) { recent.push({ col: col, row: row }); });
    });
    recent.sort(function (a, b) { return (b.row.at || 0) - (a.row.at || 0); });
    return h('div', { class: 'list' }, [
      h('div', {}, [h('h2', {}, [spec.name]), h('p', { class: 'pitch' }, [spec.pitch])]),
      spec.vague ? h('p', { class: 'panel' }, ['This description was very open, so the app starts with one records list. Name the things to track and build again in Kiln.']) : null,
      spec.collections.length ? h('div', { class: 'stats' }, spec.collections.map(function (col) {
        return h('button', { class: 'stat', type: 'button', onclick: function () { go(col.id); } }, [
          h('b', {}, [String(rows(col.id).length)]),
          h('span', {}, [col.name])
        ]);
      })) : null,
      h('section', { class: 'list' }, [
        h('h2', {}, ['Recent']),
        recent.length ? h('div', { class: 'list' }, recent.slice(0, 6).map(function (item) {
          return h('button', { class: 'card', type: 'button', onclick: function () { go(item.col.id); } }, [
            h('h3', {}, [item.row.values.title || 'Untitled']),
            h('span', { class: 'muted' }, [item.col.name + ' · ' + (item.row.status || '')])
          ]);
        })) : h('p', { class: 'muted' }, ['Nothing saved yet. Open a section and add the first record.'])
      ])
    ]);
  }

  function shopScreen() {
    var products = allProducts();
    return h('div', { class: 'list' }, [
      h('h2', {}, ['Shop']),
      products.length ? h('div', { class: 'stats' }, products.map(function (product) {
        return h('article', { class: 'card' }, [
          product.sample ? h('span', { class: 'sample' }, ['Sample price']) : null,
          h('h3', {}, [product.name]),
          h('div', { class: 'price' }, ['£' + Number(product.price).toFixed(2)]),
          h('button', { class: 'primary', type: 'button', onclick: function () { cart.push(product); draw(); } }, ['Add to cart'])
        ]);
      })) : h('p', { class: 'muted' }, ['No products yet. Add the first one below.']),
      h('form', { onsubmit: function (event) {
        event.preventDefault();
        var data = new FormData(event.target);
        var name = String(data.get('name') || '').trim();
        if (!name) return;
        state.products.push({ id: uid(), name: name, price: Number(data.get('price') || 0), sample: false });
        save();
        draw();
      } }, [
        h('h2', {}, ['Add a product']),
        h('label', {}, ['Name', h('input', { name: 'name', required: 'required' })]),
        h('label', {}, ['Price', h('input', { name: 'price', type: 'number', step: '0.01', value: '0' })]),
        h('button', { class: 'primary', type: 'submit' }, ['Add product'])
      ]),
      h('form', { onsubmit: function (event) {
        event.preventDefault();
        if (!cart.length) return;
        var data = new FormData(event.target);
        var total = cart.reduce(function (sum, item) { return sum + Number(item.price || 0); }, 0);
        var summary = cart.map(function (item) { return item.name; }).join(', ');
        var orders = ordersCol();
        if (orders) {
          rows(orders.id).unshift({
            id: uid(),
            status: orders.statuses[0],
            at: Date.now(),
            values: {
              title: String(data.get('customer') || 'Customer'),
              items: summary,
              amount: total.toFixed(2),
              notes: String(data.get('notes') || '')
            }
          });
        }
        cart = [];
        save();
        draw();
      } }, [
        h('h2', {}, ['Cart (' + cart.length + ')']),
        h('p', { class: 'muted' }, [cart.length ? cart.map(function (item) { return item.name; }).join(', ') : 'Cart is empty.']),
        h('p', {}, ['Total £' + cart.reduce(function (sum, item) { return sum + Number(item.price || 0); }, 0).toFixed(2)]),
        h('label', {}, ['Customer', h('input', { name: 'customer', required: 'required' })]),
        h('label', {}, ['Note', h('textarea', { name: 'notes' })]),
        h('button', { class: 'primary', type: 'submit' }, ['Save order'])
      ])
    ]);
  }

  function quizScreen() {
    var questions = state.questions || [];
    var question = questions[quizIndex];
    return h('div', { class: 'list' }, [
      h('h2', {}, [spec.quiz.topic + ' quiz']),
      question ? h('article', { class: 'card' }, [
        question.sample ? h('span', { class: 'sample' }, ['Sample question']) : null,
        h('h3', {}, [question.q]),
        h('div', { class: 'list' }, question.choices.map(function (choice, index) {
          return h('button', { class: 'ghost choice', type: 'button', onclick: function () {
            if (index === question.answer) quizScore += 1;
            quizIndex += 1;
            draw();
          } }, [choice]);
        })),
        h('button', { class: 'ghost', type: 'button', onclick: function () {
          state.questions = questions.filter(function (item) { return item.id !== question.id; });
          quizIndex = 0;
          save();
          draw();
        } }, ['Delete this question'])
      ]) : h('article', { class: 'card' }, [
        h('h3', {}, ['Score ' + quizScore + ' of ' + questions.length]),
        h('button', { class: 'primary', type: 'button', onclick: function () { quizIndex = 0; quizScore = 0; draw(); } }, ['Start again'])
      ]),
      h('form', { onsubmit: function (event) {
        event.preventDefault();
        var data = new FormData(event.target);
        var choices = [data.get('a'), data.get('b'), data.get('c')].map(function (item) { return String(item || '').trim(); });
        var prompt = String(data.get('q') || '').trim();
        if (!prompt || choices.some(function (choice) { return !choice; })) return;
        state.questions.push({ id: uid(), q: prompt, choices: choices, answer: 0, sample: false });
        save();
        draw();
      } }, [
        h('h2', {}, ['Add a question']),
        h('p', { class: 'muted' }, ['The first answer is the correct one.']),
        h('label', {}, ['Question', h('input', { name: 'q', required: 'required' })]),
        h('label', {}, ['Correct answer', h('input', { name: 'a', required: 'required' })]),
        h('label', {}, ['Other answer', h('input', { name: 'b', required: 'required' })]),
        h('label', {}, ['Other answer', h('input', { name: 'c', required: 'required' })]),
        h('button', { class: 'primary', type: 'submit' }, ['Add question'])
      ])
    ]);
  }

  function calculatorScreen() {
    var lines = state.cols.calculations || [];
    return h('form', { onsubmit: function (event) {
      event.preventDefault();
      var data = new FormData(event.target);
      var label = String(data.get('label') || '').trim();
      if (!label) return;
      if (!state.cols.calculations) state.cols.calculations = [];
      state.cols.calculations.unshift({ id: uid(), status: 'Saved', at: Date.now(), values: { title: label, amount: Number(data.get('amount') || 0).toFixed(2) } });
      save();
      draw();
    } }, [
      h('h2', {}, [spec.calculator.title]),
      h('label', {}, ['Line', h('input', { name: 'label', required: 'required' })]),
      h('label', {}, ['Amount', h('input', { name: 'amount', type: 'number', step: '0.01', required: 'required' })]),
      h('button', { class: 'primary', type: 'submit' }, ['Add line']),
      h('p', { class: 'price' }, ['£' + lines.reduce(function (sum, row) { return sum + Number(row.values.amount || 0); }, 0).toFixed(2)]),
      h('div', { class: 'list' }, lines.map(function (row) {
        return h('article', { class: 'card' }, [
          h('h3', {}, [row.values.title]),
          h('span', {}, ['£' + row.values.amount]),
          h('button', { class: 'ghost', type: 'button', onclick: function () {
            state.cols.calculations = state.cols.calculations.filter(function (item) { return item.id !== row.id; });
            save();
            draw();
          } }, ['Remove'])
        ]);
      }))
    ]);
  }

  function timerScreen() {
    var total = timerOn ? timerLeft : 25 * 60;
    var label = String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
    return h('div', { class: 'panel' }, [
      h('h2', {}, ['Timer']),
      h('div', { class: 'big' }, [label]),
      h('div', { class: 'row' }, [
        h('button', { class: 'primary', type: 'button', onclick: function () {
          if (timerId) return;
          timerOn = true;
          if (!timerLeft) timerLeft = 25 * 60;
          timerId = setInterval(function () {
            timerLeft -= 1;
            if (timerLeft <= 0) {
              timerLeft = 0;
              clearInterval(timerId);
              timerId = 0;
            }
            if (current === 'timer') draw();
          }, 1000);
          draw();
        } }, ['Start']),
        h('button', { class: 'ghost', type: 'button', onclick: function () { clearInterval(timerId); timerId = 0; draw(); } }, ['Pause']),
        h('button', { class: 'ghost', type: 'button', onclick: function () {
          clearInterval(timerId);
          timerId = 0;
          timerOn = false;
          timerLeft = 0;
          draw();
        } }, ['Reset'])
      ])
    ]);
  }

  function tallyScreen() {
    return h('div', { class: 'panel' }, [
      h('h2', {}, ['Tally']),
      h('div', { class: 'big' }, [String(state.tally || 0)]),
      h('div', { class: 'row' }, [
        h('button', { class: 'primary', type: 'button', onclick: function () { state.tally += 1; save(); draw(); } }, ['Add']),
        h('button', { class: 'ghost', type: 'button', onclick: function () { state.tally = Math.max(0, (state.tally || 0) - 1); save(); draw(); } }, ['Subtract']),
        h('button', { class: 'ghost', type: 'button', onclick: function () { state.tally = 0; save(); draw(); } }, ['Reset'])
      ])
    ]);
  }

  function screen() {
    if (current === 'home') return homeScreen();
    if (current === 'shop' && spec.shop) return shopScreen();
    if (current === 'quiz' && spec.quiz) return quizScreen();
    if (current === 'calculator' && spec.calculator) return calculatorScreen();
    if (current === 'timer') return timerScreen();
    if (current === 'tally') return tallyScreen();
    var col = collection(current);
    return col ? collectionScreen(col) : homeScreen();
  }

  function signScreen() {
    var mode = state.users && state.users.length ? 'in' : 'up';
    var notice = '';
    function paint() {
      root.textContent = '';
      root.appendChild(h('div', { class: 'shell' }, [
        h('aside', { class: 'side' }, [
          spec.mark ? h('div', { class: 'mark' }, [spec.mark]) : null,
          h('h1', {}, [spec.name]),
          h('p', { class: 'fine' }, ['Sign-in stays in this browser.'])
        ]),
        h('main', { class: 'main' }, [
          h('form', { onsubmit: function (event) {
            event.preventDefault();
            var data = new FormData(event.target);
            var email = String(data.get('email') || '').trim().toLowerCase();
            var password = String(data.get('password') || '');
            if (!email || password.length < 4) {
              notice = 'Use an email and a password of at least 4 characters.';
              paint();
              return;
            }
            state.users = state.users || [];
            var found = state.users.filter(function (user) { return user.email === email; })[0];
            if (mode === 'up') {
              if (found) {
                notice = 'That email already has an account. Sign in instead.';
                paint();
                return;
              }
              state.users.push({ email: email, password: password, role: state.users.length ? 'Staff' : 'Owner' });
              save();
            } else if (!found || found.password !== password) {
              notice = 'That email and password do not match.';
              paint();
              return;
            }
            setSession(email);
            draw();
          } }, [
            h('h2', {}, [mode === 'up' ? 'Create an account' : 'Sign in']),
            h('p', { class: 'pitch' }, ['Accounts are saved in this browser with the app. The first account is the owner. Later accounts are staff. This is not a hosted login service.']),
            notice ? h('p', { class: 'panel' }, [notice]) : null,
            h('label', {}, ['Email', h('input', { name: 'email', type: 'email', required: 'required' })]),
            h('label', {}, ['Password', h('input', { name: 'password', type: 'password', required: 'required', minlength: '4' })]),
            h('div', { class: 'row' }, [
              h('button', { class: 'primary', type: 'submit' }, [mode === 'up' ? 'Create account' : 'Sign in']),
              h('button', { class: 'ghost', type: 'button', onclick: function () { mode = mode === 'up' ? 'in' : 'up'; notice = ''; paint(); } }, [mode === 'up' ? 'I already have an account' : 'Create an account'])
            ])
          ])
        ])
      ]));
    }
    paint();
  }

  function draw() {
    if (spec.auth && !sessionUser()) {
      signScreen();
      return;
    }
    shell();
    document.getElementById('main').appendChild(screen());
  }

  draw();
})();
