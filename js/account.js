(function () {
  var snap = KilnWallet.snapshot();
  KilnWallet.mount(document.getElementById('account-pill'));
  var box = document.getElementById('billing');
  var card = document.createElement('article');
  card.className = 'card';
  var title = document.createElement('h2');
  title.textContent = snap.active && snap.plan ? snap.plan.name : 'No plan yet';
  var detail = document.createElement('p');
  detail.textContent = snap.active
    ? snap.balance + ' credits · ' + snap.days + ' days left' + (snap.email ? ' · ' + snap.email : '')
    : 'Start Free or choose a paid plan. The subscription is stored in this browser.';
  card.appendChild(title);
  card.appendChild(detail);
  if (snap.plan && snap.plan.features) {
    var features = document.createElement('ul');
    features.className = 'checks';
    snap.plan.features.forEach(function (feature) {
      var item = document.createElement('li');
      item.textContent = feature;
      features.appendChild(item);
    });
    card.appendChild(features);
  }
  box.appendChild(card);

  if (snap.apps.length) {
    var appsTitle = document.createElement('h2');
    appsTitle.className = 'section-title';
    appsTitle.textContent = 'Apps built here';
    var list = document.createElement('ul');
    list.className = 'receipts';
    snap.apps.slice().reverse().forEach(function (app) {
      var item = document.createElement('li');
      item.textContent = app.name + ' · ' + app.cost + ' credits';
      list.appendChild(item);
    });
    box.appendChild(appsTitle);
    box.appendChild(list);
  }

  if (snap.entries.length) {
    var ledgerTitle = document.createElement('h2');
    ledgerTitle.className = 'section-title';
    ledgerTitle.textContent = 'Credits';
    var ledger = document.createElement('ul');
    ledger.className = 'receipts';
    snap.entries.slice(0, 12).forEach(function (entry) {
      var item = document.createElement('li');
      if (entry.type === 'build') item.textContent = 'Build · ' + (entry.name || 'App') + ' · ' + entry.credits + ' credits';
      else if (entry.type === 'discuss') item.textContent = (entry.name || 'Message') + ' · ' + entry.credits + ' credit';
      else item.textContent = (entry.type === 'topup' ? 'Credit top-up' : 'Subscription') + ' · +' + entry.credits + ' credits · ' + KilnWallet.money(entry.price || 0);
      ledger.appendChild(item);
    });
    box.appendChild(ledgerTitle);
    box.appendChild(ledger);
  }
})();
