(function () {
  var promptBox = document.getElementById('prompt');
  var costLine = document.getElementById('cost-line');
  var accessNote = document.getElementById('access-note');
  var log = document.getElementById('log');
  var historyBox = document.getElementById('history');
  var frame = document.getElementById('preview');
  var empty = document.getElementById('empty');
  var codeView = document.getElementById('code-view');
  var settingsPanel = document.getElementById('settings-panel');
  var subPanel = document.getElementById('sub-panel');
  var publishLink = document.getElementById('publish-link');
  var publishBox = document.getElementById('publish-box');
  var linkName = document.getElementById('link-name');
  var modeBuild = document.getElementById('mode-build');
  var modePlan = document.getElementById('mode-plan');
  var modeDiscuss = document.getElementById('mode-discuss');
  var openApp = null;
  var mode = 'build';
  var tab = 'preview';

  function say(role, text) {
    var item = document.createElement('p');
    item.className = role;
    item.textContent = text;
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
  }

  function planFlag(flag) {
    var snap = KilnWallet.snapshot();
    return !!(snap.active && snap.plan && snap.plan[flag]);
  }

  function slug(name) {
    return String(name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 31) || 'app';
  }

  function show(html) {
    frame.hidden = tab !== 'preview';
    empty.hidden = true;
    frame.srcdoc = html;
    codeView.value = html;
  }

  function takeCode() {
    if (!openApp || tab !== 'code') return;
    if (codeView.value.indexOf('kiln-spec') === -1) return;
    openApp.html = codeView.value;
  }

  function setTab(next) {
    takeCode();
    tab = next;
    [['preview', 'tab-preview'], ['code', 'tab-code'], ['settings', 'tab-settings']].forEach(function (item) {
      document.getElementById(item[1]).classList.toggle('on', next === item[0]);
    });
    var hasApp = !!(openApp && openApp.html);
    frame.hidden = next !== 'preview' || !hasApp;
    codeView.hidden = next !== 'code' || !hasApp;
    settingsPanel.hidden = next !== 'settings' || !hasApp;
    empty.hidden = hasApp;
    if (next === 'code' && openApp) codeView.value = openApp.html;
    if (next === 'settings') renderSettings();
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
    var outside = outsideTool(text);
    var extra = outside ? ' Kiln does not connect to ' + outside + '.' : '';
    if (!openApp) return 'Nothing is open yet. Switch to Build and describe the app. Discuss will not change the preview.' + extra;
    var spec = KilnGenerator.parsePrompt(openApp.prompt + '\n' + text);
    var price = KilnGenerator.quote(spec, { revision: true });
    return openApp.name + ' has these screens: ' + (openApp.screens || []).join(', ') + '. In Build mode that change would cost ' + price + ' credits and would update this app. Discuss leaves the preview as it is.' + extra;
  }

  function outsideTool(text) {
    var hit = String(text || '').match(/\b(slack|gmail|notion|hubspot|salesforce|stripe|twilio|github|google calendar)\b/i);
    return hit ? hit[1] : '';
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
        openApp = {
          name: app.name,
          prompt: app.prompt,
          html: app.html,
          cost: app.cost,
          screens: app.screens || [],
          versions: [],
          slug: '',
          url: ''
        };
        show(app.html);
        publishBox.hidden = true;
        publishLink.textContent = '';
        setTab(tab);
        estimate();
      });
      historyBox.appendChild(button);
    });
  }

  function renderSettings() {
    settingsPanel.textContent = '';
    if (!openApp) return;
    var spec = KilnGenerator.parsePrompt(openApp.prompt || '');
    var title = document.createElement('h2');
    title.textContent = 'App settings';
    var copy = document.createElement('p');
    copy.className = 'meta';
    copy.textContent = 'A look change costs 2 credits and keeps the records key for this app. The live link does not change until you publish again.';
    var nameLabel = document.createElement('label');
    nameLabel.className = 'field';
    nameLabel.textContent = 'App name';
    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'look-name';
    nameInput.value = openApp.name;
    nameLabel.appendChild(nameInput);
    var colorLabel = document.createElement('label');
    colorLabel.className = 'field';
    colorLabel.textContent = 'Accent';
    var colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = 'look-accent';
    colorInput.value = '#b4532a';
    colorLabel.appendChild(colorInput);
    var apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'btn';
    apply.textContent = 'Apply look · 2 credits';
    apply.addEventListener('click', function () {
      applyBuild({
        mode: 'build',
        cost: 2,
        revise: false,
        look: true,
        name: nameInput.value.trim(),
        accent: colorInput.value,
        typed: 'Update the name and accent',
        full: openApp.prompt
      });
    });
    var builtTitle = document.createElement('h3');
    builtTitle.textContent = 'Built in';
    var list = document.createElement('ul');
    list.className = 'checks';
    [
      'Records stay in the browser that opens the app.',
      spec.auth ? 'Sign-in is on. The first account is the owner.' : 'Ask for members, login, or roles and the next build adds sign-in.',
      spec.shop ? 'Shop orders are saved in the app. Cards are not charged.' : 'A shop or payments request adds an orders list. Cards are not charged.',
      'Home shows a count for each list.',
      planFlag('publish') ? 'Publish keeps the last live version until you publish again.' : 'A public link is included with Super Pro.'
    ].forEach(function (line) {
      var item = document.createElement('li');
      item.textContent = line;
      list.appendChild(item);
    });
    var versionTitle = document.createElement('h3');
    versionTitle.textContent = 'Earlier versions';
    var versionNote = document.createElement('p');
    versionNote.className = 'meta';
    versionNote.textContent = (openApp.versions && openApp.versions.length)
      ? 'Restore puts that version in the preview. Publish it if it should replace the live link.'
      : 'Versions appear here after the next change.';
    settingsPanel.appendChild(title);
    settingsPanel.appendChild(copy);
    settingsPanel.appendChild(nameLabel);
    settingsPanel.appendChild(colorLabel);
    settingsPanel.appendChild(apply);
    settingsPanel.appendChild(builtTitle);
    settingsPanel.appendChild(list);
    settingsPanel.appendChild(versionTitle);
    settingsPanel.appendChild(versionNote);
    (openApp.versions || []).slice().reverse().forEach(function (version) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn secondary';
      button.textContent = 'Restore ' + version.name;
      button.addEventListener('click', function () {
        openApp.html = version.html;
        openApp.name = version.name;
        openApp.prompt = version.prompt;
        show(version.html);
        setTab('preview');
        say('kiln', 'Restored ' + version.name + ' in the preview. The live link is unchanged.');
      });
      settingsPanel.appendChild(button);
    });
    if (openApp.slug) loadViews();
  }

  function loadViews() {
    fetch('/api/stats?slug=' + encodeURIComponent(openApp.slug)).then(function (response) {
      if (!response.ok) return null;
      return response.json();
    }).then(function (payload) {
      if (!payload) return;
      var line = document.createElement('p');
      line.className = 'meta';
      line.textContent = 'Live views on /p/' + payload.slug + ': ' + payload.views;
      settingsPanel.appendChild(line);
    }).catch(function () { /* stats need the Kiln server */ });
  }

  function refreshAccess() {
    var snap = KilnWallet.snapshot();
    KilnWallet.mount(document.getElementById('account-pill'));
    subPanel.hidden = snap.active;
    accessNote.textContent = snap.active
      ? snap.plan.name + ' · ' + snap.balance + ' credits · ' + snap.days + ' days left' + (snap.plan.publish ? ' · publish is on' : '')
      : 'Start Free or choose a paid plan to chat.';
    renderHistory();
  }

  function gate(cost) {
    var snap = KilnWallet.snapshot();
    if (!snap.active) {
      say('kiln', 'Start Free or choose a paid plan. The plans are above.');
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
    var result = KilnGenerator.build(request.look ? (openApp && openApp.prompt) : request.typed, {
      revision: request.look ? false : request.revise,
      previous: !request.look && request.revise && openApp ? openApp.prompt : '',
      whiteLabel: planFlag('whiteLabel'),
      look: !!request.look,
      name: request.name || '',
      accent: request.accent || ''
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
    if (!openApp && request.look) return;
    if (!gate(request.cost)) return;
    whenBuilt(request).then(function (result) {
      var previous = openApp;
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
      var versions = previous && previous.versions ? previous.versions.slice() : [];
      if (previous && previous.html) {
        versions.push({ name: previous.name, html: previous.html, prompt: previous.prompt });
        versions = versions.slice(-4);
      }
      openApp = {
        name: result.spec.name,
        prompt: request.full,
        html: result.html,
        cost: result.cost,
        screens: result.screens,
        versions: versions,
        slug: previous && previous.slug || '',
        url: previous && previous.url || ''
      };
      show(result.html);
      setTab('preview');
      var left = KilnWallet.snapshot().balance;
      var message = (request.look ? 'Updated the look of ' : 'Built ') + result.spec.name + '. Screens: ' + result.screens.join(', ') + '. Used ' + result.cost + ' credits. ' + left + ' left.';
      if (result.spec.vague) message += ' The description was very open, so this starts as a records app. Name the things it should track and send another Build message.';
      var outside = outsideTool(request.typed);
      if (outside) message += ' Kiln did not connect to ' + outside + '. Records, orders, and sign-in stay inside the app.';
      if (openApp.url) message += ' The live link still shows the last published version.';
      say('kiln', message);
      promptBox.value = '';
      refreshAccess();
      estimate();
    }).catch(function () {
      say('kiln', 'The builder could not load. Start Kiln with node server.js and open this page from there.');
    });
  }

  function showPublished(payload) {
    openApp.slug = payload.id;
    openApp.url = payload.url;
    publishLink.textContent = '';
    var link = document.createElement('a');
    link.href = payload.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = (payload.replaced ? 'Updated live app: ' : 'Published: ') + payload.url;
    publishLink.appendChild(link);
    say('kiln', (payload.replaced ? 'Replaced the live version of ' : 'Published ') + openApp.name + ' at ' + payload.url + '. Views so far: ' + payload.views + '.');
  }

  document.getElementById('composer').addEventListener('submit', sendMessage);
  modeBuild.addEventListener('click', function () { setMode('build'); });
  modePlan.addEventListener('click', function () { setMode('plan'); });
  modeDiscuss.addEventListener('click', function () { setMode('discuss'); });
  document.getElementById('tab-preview').addEventListener('click', function () { setTab('preview'); });
  document.getElementById('tab-code').addEventListener('click', function () { setTab('code'); });
  document.getElementById('tab-settings').addEventListener('click', function () { setTab('settings'); });
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
    codeView.hidden = true;
    settingsPanel.hidden = true;
    empty.hidden = false;
    publishBox.hidden = true;
    publishLink.textContent = '';
    say('kiln', 'The next Build message starts a new app.');
    estimate();
  });
  document.getElementById('download').addEventListener('click', function () {
    if (!openApp) return;
    if (!planFlag('download')) {
      say('kiln', 'Download is included on paid plans. Free can still build, preview, and read the code.');
      return;
    }
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
    if (!planFlag('publish')) {
      say('kiln', 'Publish is included with Super Pro. Paid plans can still download the app. A published link stays on the last version until you publish again.');
      return;
    }
    publishBox.hidden = false;
    if (!linkName.value) linkName.value = slug(openApp.name);
    linkName.focus();
  });
  linkName.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') event.preventDefault();
  });
  document.getElementById('publish-go').addEventListener('click', function () {
    if (!openApp || !planFlag('publish')) return;
    takeCode();
    var chosen = slug(linkName.value);
    if (chosen.length < 3) {
      say('kiln', 'Use at least 3 letters or numbers for the link name.');
      return;
    }
    fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: openApp.name, html: openApp.html, slug: chosen })
    }).then(function (response) {
      if (!response.ok) throw new Error('publish failed');
      return response.json();
    }).then(showPublished).catch(function () {
      say('kiln', 'Publish needs the Kiln server. From this project folder run node server.js, then open http://127.0.0.1:8787/studio.html.');
    });
  });
  document.getElementById('unpublish').addEventListener('click', function () {
    if (!openApp || !openApp.slug) {
      say('kiln', 'This app does not have a live link yet.');
      return;
    }
    var slugToDrop = openApp.slug;
    fetch('/api/publish?slug=' + encodeURIComponent(slugToDrop), { method: 'DELETE' }).then(function (response) {
      if (!response.ok) throw new Error('missing');
      openApp.slug = '';
      openApp.url = '';
      publishLink.textContent = '';
      say('kiln', 'Unpublished /p/' + slugToDrop + '. The app is still in the studio.');
    }).catch(function () {
      say('kiln', 'Unpublish needs the Kiln server and a link that is still live.');
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
  say('kiln', 'Build changes the preview. Plan costs 1 credit and waits for Approve. Discuss costs 1 credit and leaves the preview alone. Code and Settings are beside the preview. Super Pro publishes a named link, and that live page stays put until you publish again.');
  KilnPlans.mount(subPanel, { topups: false, onChange: refreshAccess });
  refreshAccess();
  estimate();
})();
