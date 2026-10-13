(function () {
  var promptBox = document.getElementById('prompt');
  var costLine = document.getElementById('cost-line');
  var accessNote = document.getElementById('access-note');
  var log = document.getElementById('log');
  var historyBox = document.getElementById('history');
  var frame = document.getElementById('preview');
  var empty = document.getElementById('empty');
  var subPanel = document.getElementById('sub-panel');
  var publishLink = document.getElementById('publish-link');
  var modeBuild = document.getElementById('mode-build');
  var modePlan = document.getElementById('mode-plan');
  var modeDiscuss = document.getElementById('mode-discuss');
  var openApp = null;
  var mode = 'build';

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

  function setMode(next) {
    mode = next;
    [['build', modeBuild, 'Build'], ['plan', modePlan, 'Plan'], ['discuss', modeDiscuss, 'Discuss']].forEach(function (item) {
      item[1].classList.toggle('on', next === item[0]);
      item[1].setAttribute('aria-pressed', next === item[0] ? 'true' : 'false');
      if (next === item[0]) document.getElementById('build').textContent = item[2];
    });
    estimate();
  }

  function estimate() {
    var typed = promptBox.value.trim();
    if (!typed) {
      if (mode === 'discuss') costLine.textContent = 'Discuss costs 1 credit and does not change the preview.';
      else if (mode === 'plan') costLine.textContent = 'Plan costs 1 credit. Approving the plan spends the build credits.';
      else costLine.textContent = openApp ? 'The next Build message updates ' + openApp.name + '.' : 'Describe any app to start.';
      return null;
    }
    if (mode === 'discuss') {
      costLine.textContent = 'Discuss · 1 credit · preview stays as it is';
      return { mode: 'discuss', cost: 1, typed: typed };
    }
    var updating = !!openApp;
    var full = updating ? (openApp.prompt + '\n' + typed) : typed;
    var spec = KilnGenerator.parsePrompt(full);
    var price = KilnGenerator.quote(spec, { revision: updating });
    var screens = KilnGenerator.screenList(spec).join(', ');
    if (mode === 'plan') {
      costLine.textContent = 'Plan · 1 credit now · ' + price + ' if you approve · ' + screens;
      return { mode: 'plan', spec: spec, cost: 1, buildCost: price, revise: updating, typed: typed, full: full };
    }
    costLine.textContent = (updating ? 'Update ' + openApp.name : 'New app') + ' · ' + price + ' credits · ' + screens;
    return { mode: 'build', spec: spec, cost: price, revise: updating, typed: typed, full: full };
  }

  function discussReply(text) {
    if (!openApp) return 'Nothing is open yet. Switch to Build and describe the app. Discuss will not change the preview.';
    var spec = KilnGenerator.parsePrompt(openApp.prompt + '\n' + text);
    var price = KilnGenerator.quote(spec, { revision: true });
    return openApp.name + ' has these screens: ' + (openApp.screens || []).join(', ') + '. In Build mode that change would cost ' + price + ' credits and would update this app. Discuss leaves the preview as it is.';
  }

  function renderHistory() {
    var apps = KilnWallet.snapshot().apps.slice().reverse();
    historyBox.textContent = '';
    apps.forEach(function (app) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn secondary';
      button.textContent = app.name + ' · ' + app.cost + ' credits';
      button.addEventListener('click', function () {
        openApp = app;
        show(app.html);
        publishLink.textContent = '';
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
      : 'Subscribe to chat. Build and Discuss both spend credits.';
    renderHistory();
  }

  function gate(cost) {
    var snap = KilnWallet.snapshot();
    if (!snap.active) {
      say('kiln', 'A subscription is required. Choose a plan above.');
      subPanel.hidden = false;
      subPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return false;
    }
    if (snap.balance < cost) {
      say('kiln', 'This message costs ' + cost + ' credits and this subscription has ' + snap.balance + '. Buy more credits on the pricing page.');
      return false;
    }
    return true;
  }

  function showPlan(request) {
    var card = document.createElement('div');
    card.className = 'chat-plan';
    var copy = document.createElement('p');
    copy.textContent = 'Plan for ' + request.spec.name + '. Screens: ' + KilnGenerator.screenList(request.spec).join(', ') + '. Approve spends ' + request.buildCost + ' credits and builds it.';
    var row = document.createElement('div');
    row.className = 'row';
    var yes = document.createElement('button');
    yes.type = 'button';
    yes.className = 'btn';
    yes.textContent = 'Approve';
    var no = document.createElement('button');
    no.type = 'button';
    no.className = 'btn secondary';
    no.textContent = 'Reject';
    yes.addEventListener('click', function () {
      yes.disabled = true;
      no.disabled = true;
      applyBuild({
        mode: 'build',
        spec: request.spec,
        cost: request.buildCost,
        revise: request.revise,
        typed: request.typed,
        full: request.full
      });
    });
    no.addEventListener('click', function () {
      say('kiln', 'Plan rejected. The preview is unchanged.');
      card.remove();
    });
    row.appendChild(yes);
    row.appendChild(no);
    card.appendChild(copy);
    card.appendChild(row);
    log.appendChild(card);
    log.scrollTop = log.scrollHeight;
  }

  function whenBuilt(request) {
    var result = KilnGenerator.build(request.typed, {
      revision: request.revise,
      previous: request.revise ? openApp.prompt : ''
    });
    return result && typeof result.then === 'function' ? result : Promise.resolve(result);
  }

  function sendMessage(event) {
    if (event) event.preventDefault();
    var request = estimate();
    if (!request) {
      say('kiln', 'Write a message first.');
      promptBox.focus();
      return;
    }
    if (!gate(request.cost)) return;
    say('user', request.typed);
    if (request.mode === 'plan') {
      var spentPlan = KilnWallet.spend(1, { name: 'Plan' });
      if (spentPlan.error) {
        say('kiln', 'Plan needs a subscription and 1 credit.');
        refreshAccess();
        return;
      }
      showPlan(request);
      say('kiln', 'Plan ready. ' + KilnWallet.snapshot().balance + ' credits left.');
      promptBox.value = '';
      refreshAccess();
      estimate();
      return;
    }
    if (request.mode === 'discuss') {
      var spentTalk = KilnWallet.spend(1, { name: 'Discuss' });
      if (spentTalk.error) {
        say('kiln', 'Discuss needs a subscription and 1 credit.');
        refreshAccess();
        return;
      }
      say('kiln', discussReply(request.typed) + ' ' + KilnWallet.snapshot().balance + ' credits left.');
      promptBox.value = '';
      refreshAccess();
      estimate();
      return;
    }
    applyBuild(request);
  }

  function applyBuild(request) {
    if (!gate(request.cost)) return;
    whenBuilt(request).then(function (result) {
      var spent = KilnWallet.spend(result.cost, {
        name: result.spec.name,
        prompt: request.full,
        html: result.html,
        screens: result.screens
      });
      if (spent.error) {
        say('kiln', spent.error === 'credits' ? 'Not enough credits for this build.' : 'A subscription is required.');
        refreshAccess();
        return;
      }
      openApp = {
        name: result.spec.name,
        prompt: request.full,
        html: result.html,
        cost: result.cost,
        screens: result.screens
      };
      show(result.html);
      var left = KilnWallet.snapshot().balance;
      var message = 'Built ' + result.spec.name + '. Screens: ' + result.screens.join(', ') + '. Used ' + result.cost + ' credits. ' + left + ' left.';
      if (result.spec.vague) message += ' The description was very open, so this starts as a records app. Name the things it should track and send another Build message.';
      say('kiln', message);
      promptBox.value = '';
      publishLink.textContent = '';
      refreshAccess();
      estimate();
    }).catch(function () {
      say('kiln', 'The builder could not load. Start Kiln with node server.js and open this page from there.');
    });
  }

  document.getElementById('composer').addEventListener('submit', sendMessage);
  modeBuild.addEventListener('click', function () { setMode('build'); });
  modePlan.addEventListener('click', function () { setMode('plan'); });
  modeDiscuss.addEventListener('click', function () { setMode('discuss'); });
  document.getElementById('device-desk').addEventListener('click', function () {
    document.getElementById('stage').classList.remove('phone');
    document.getElementById('device-desk').classList.add('on');
    document.getElementById('device-phone').classList.remove('on');
  });
  document.getElementById('device-phone').addEventListener('click', function () {
    document.getElementById('stage').classList.add('phone');
    document.getElementById('device-phone').classList.add('on');
    document.getElementById('device-desk').classList.remove('on');
  });
  document.getElementById('new-app').addEventListener('click', function () {
    openApp = null;
    frame.hidden = true;
    empty.hidden = false;
    publishLink.textContent = '';
    say('kiln', 'The next Build message starts a new app.');
    estimate();
  });
  document.getElementById('download').addEventListener('click', function () {
    if (!openApp) return;
    var url = URL.createObjectURL(new Blob([openApp.html], { type: 'text/html' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = slug(openApp.name) + '.html';
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  });
  document.getElementById('publish').addEventListener('click', function () {
    if (!openApp) {
      say('kiln', 'Build an app before publishing it.');
      return;
    }
    fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: openApp.name, html: openApp.html })
    }).then(function (response) {
      if (!response.ok) throw new Error('publish failed');
      return response.json();
    }).then(function (payload) {
      publishLink.textContent = '';
      var link = document.createElement('a');
      link.href = payload.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Published: ' + payload.url;
      publishLink.appendChild(link);
      say('kiln', 'Published ' + openApp.name + ' at ' + payload.url);
    }).catch(function () {
      say('kiln', 'Publish needs the Kiln server. From this project folder run node server.js, then open http://127.0.0.1:8787/studio.html.');
    });
  });
  promptBox.addEventListener('input', estimate);
  promptBox.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });

  var preset = new URLSearchParams(location.search).get('prompt');
  if (preset) promptBox.value = preset;
  say('kiln', 'Build changes the preview. Plan costs 1 credit and waits for Approve. Discuss costs 1 credit and leaves the preview alone.');
  KilnPlans.mount(subPanel, { topups: false, onChange: refreshAccess });
  refreshAccess();
  estimate();
})();
