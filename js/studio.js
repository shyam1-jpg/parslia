(function () {
  var promptBox = document.getElementById('prompt');
  var costLine = document.getElementById('cost-line');
  var accessNote = document.getElementById('access-note');
  var log = document.getElementById('log');
  var historyBox = document.getElementById('history');
  var revise = document.getElementById('revise-wrap');
  var reviseInput = document.getElementById('revise');
  var frame = document.getElementById('preview');
  var empty = document.getElementById('empty');
  var subPanel = document.getElementById('sub-panel');
  var openApp = null;

  function say(role, text) {
    var item = document.createElement('p');
    item.className = role;
    item.textContent = text;
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
  }

  function slug(name) {
    return String(name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
  }

  function show(html) {
    frame.hidden = false;
    empty.hidden = true;
    frame.srcdoc = html;
  }

  function fileUrl(html) {
    return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  }

  function estimate() {
    var typed = promptBox.value.trim();
    var updating = !!(reviseInput.checked && openApp);
    if (!typed) {
      costLine.textContent = updating
        ? 'Write the change you want. Uncheck update to describe a new app.'
        : 'Describe any app. Say what it should keep track of.';
      return null;
    }
    var full = updating ? (openApp.prompt + '\n' + typed) : typed;
    var spec = KilnGenerator.parsePrompt(full);
    var price = KilnGenerator.quote(spec, { revision: updating });
    var screens = KilnGenerator.screenList(spec).join(', ');
    costLine.textContent = (updating ? 'Update' : 'New app') + ' · ' + price + ' credits · ' + screens;
    return { spec: spec, cost: price, revise: updating, typed: typed, full: full };
  }

  function renderHistory() {
    var apps = KilnWallet.snapshot().apps.slice().reverse();
    historyBox.textContent = '';
    revise.hidden = !openApp;
    apps.forEach(function (app) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn secondary';
      button.textContent = app.name + ' · ' + app.cost + ' credits';
      button.addEventListener('click', function () {
        openApp = app;
        show(app.html);
        revise.hidden = false;
        reviseInput.checked = true;
        estimate();
      });
      historyBox.appendChild(button);
    });
  }

  function refreshAccess() {
    var snap = KilnWallet.snapshot();
    KilnWallet.mount(document.getElementById('account-pill'));
    subPanel.hidden = snap.active;
    accessNote.textContent = snap.active
      ? snap.plan.name + ' · ' + snap.balance + ' credits · ' + snap.days + ' days left'
      : 'Subscribe to build. Anyone can subscribe, then describe any app.';
    renderHistory();
  }

  function whenBuilt(request) {
    var result = KilnGenerator.build(request.typed, { revision: request.revise, previous: request.revise ? openApp.prompt : '' });
    return result && typeof result.then === 'function' ? result : Promise.resolve(result);
  }

  function build() {
    var request = estimate();
    if (!request) {
      say('kiln', 'Write what the app is for, then build it.');
      promptBox.focus();
      return;
    }
    var snap = KilnWallet.snapshot();
    if (!snap.active) {
      say('kiln', 'A subscription is required before Kiln will build. Choose a plan below.');
      subPanel.hidden = false;
      subPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (snap.balance < request.cost) {
      say('kiln', 'This build costs ' + request.cost + ' credits and this subscription has ' + snap.balance + '. Buy more credits on the pricing page.');
      return;
    }
    say('user', request.typed || 'Update the open app');
    whenBuilt(request).then(function (result) {
      var spent = KilnWallet.spend(result.cost, {
        name: result.spec.name,
        prompt: request.full,
        html: result.html,
        screens: result.screens
      });
      if (spent.error) {
        say('kiln', spent.error === 'credits'
          ? 'Not enough credits for this build.'
          : 'A subscription is required before Kiln will build.');
        refreshAccess();
        return;
      }
      openApp = { name: result.spec.name, prompt: request.full, html: result.html, cost: result.cost, screens: result.screens };
      show(result.html);
      var left = KilnWallet.snapshot().balance;
      var message = 'Built ' + result.spec.name + '. Screens: ' + result.screens.join(', ') + '. Used ' + result.cost + ' credits. ' + left + ' left.';
      if (result.spec.vague) message += ' The description was very open, so this starts as a records app. Name the things it should track and update it.';
      say('kiln', message);
      promptBox.value = '';
      revise.hidden = false;
      reviseInput.checked = true;
      refreshAccess();
      estimate();
    }).catch(function () {
      say('kiln', 'The builder could not load. Open Kiln from a web server, then try again.');
    });
  }

  document.getElementById('build').addEventListener('click', build);
  document.getElementById('download').addEventListener('click', function () {
    if (!openApp) return;
    var url = fileUrl(openApp.html);
    var link = document.createElement('a');
    link.href = url;
    link.download = slug(openApp.name) + '.html';
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  });
  document.getElementById('open-app').addEventListener('click', function () {
    if (!openApp) return;
    window.open(fileUrl(openApp.html), '_blank', 'noopener');
  });
  promptBox.addEventListener('input', estimate);
  reviseInput.addEventListener('change', estimate);
  promptBox.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      build();
    }
  });

  var preset = new URLSearchParams(location.search).get('prompt');
  if (preset) promptBox.value = preset;
  say('kiln', 'Subscribers describe any app. Kiln spends credits and builds a working web app from that description.');
  KilnPlans.mount(subPanel, { topups: false, onChange: refreshAccess });
  refreshAccess();
  estimate();
})();
