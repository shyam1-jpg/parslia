(function () {
  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function mount(container, options) {
    options = options || {};
    var picked = null;

    function draw() {
      var snap = KilnWallet.snapshot();
      container.textContent = '';

      var email = document.createElement('label');
      email.className = 'field';
      email.textContent = 'Email';
      var input = document.createElement('input');
      input.type = 'email';
      input.required = true;
      input.autocomplete = 'email';
      input.value = snap.email || '';
      input.setAttribute('aria-label', 'Email');
      email.appendChild(input);
      container.appendChild(email);

      var error = document.createElement('p');
      error.className = 'error';
      error.hidden = true;
      container.appendChild(error);

      var grid = document.createElement('div');
      grid.className = 'plans';
      KilnWallet.plans.forEach(function (plan) {
        var card = document.createElement('article');
        card.className = 'plan' + (plan.super ? ' super' : '');
        if (plan.super) {
          var badge = document.createElement('p');
          badge.className = 'kicker';
          badge.textContent = 'For client delivery';
          card.appendChild(badge);
        }
        var title = document.createElement('h3');
        title.textContent = plan.name;
        var price = document.createElement('div');
        price.className = 'price';
        price.textContent = KilnWallet.money(plan.price);
        var unit = document.createElement('p');
        unit.textContent = 'a month · ' + plan.credits + ' credits';
        var blurb = document.createElement('p');
        blurb.textContent = plan.blurb;
        var features = document.createElement('ul');
        (plan.features || []).forEach(function (feature) {
          var item = document.createElement('li');
          item.textContent = feature;
          features.appendChild(item);
        });
        var button = document.createElement('button');
        button.className = 'btn';
        button.type = 'button';
        button.style.marginTop = '12px';
        button.textContent = snap.active && snap.plan && snap.plan.id === plan.id ? 'Renew ' + plan.name : 'Choose ' + plan.name;
        button.addEventListener('click', function () { choose(plan); });
        card.appendChild(title);
        card.appendChild(price);
        card.appendChild(unit);
        card.appendChild(blurb);
        card.appendChild(features);
        card.appendChild(button);
        grid.appendChild(card);
      });
      container.appendChild(grid);

      if (options.topups) {
        var topTitle = document.createElement('h2');
        topTitle.className = 'section-title';
        topTitle.textContent = 'Buy more credits';
        var topNote = document.createElement('p');
        topNote.className = 'sub';
        topNote.textContent = snap.active
          ? 'Top-ups add credits to the subscription already on this browser.'
          : 'Start a subscription first. Top-ups are for subscribers.';
        var tops = document.createElement('div');
        tops.className = 'tops';
        KilnWallet.topups.forEach(function (pack) {
          var card = document.createElement('article');
          card.className = 'card';
          var title = document.createElement('h3');
          title.textContent = pack.name;
          var price = document.createElement('div');
          price.className = 'price';
          price.textContent = KilnWallet.money(pack.price);
          var blurb = document.createElement('p');
          blurb.textContent = pack.blurb;
          var button = document.createElement('button');
          button.className = 'btn secondary';
          button.type = 'button';
          button.textContent = 'Buy ' + pack.name;
          button.addEventListener('click', function () { choose(pack, true); });
          card.appendChild(title);
          card.appendChild(price);
          card.appendChild(blurb);
          card.appendChild(button);
          tops.appendChild(card);
        });
        container.appendChild(topTitle);
        container.appendChild(topNote);
        container.appendChild(tops);
      }

      var confirm = document.createElement('div');
      confirm.className = 'note';
      confirm.hidden = true;
      var confirmCopy = document.createElement('p');
      var yes = document.createElement('button');
      yes.className = 'btn';
      yes.type = 'button';
      yes.textContent = 'Confirm';
      var no = document.createElement('button');
      no.className = 'btn secondary';
      no.type = 'button';
      no.textContent = 'Back';
      no.addEventListener('click', function () { confirm.hidden = true; picked = null; });
      yes.addEventListener('click', function () { commit(); });
      confirm.appendChild(confirmCopy);
      var row = document.createElement('div');
      row.className = 'row';
      row.appendChild(yes);
      row.appendChild(no);
      confirm.appendChild(row);
      container.appendChild(confirm);

      if (snap.entries.length) {
        var listTitle = document.createElement('h2');
        listTitle.className = 'section-title';
        listTitle.textContent = 'On this browser';
        var list = document.createElement('ul');
        list.className = 'receipts';
        snap.entries.slice(0, 8).forEach(function (entry) {
          var item = document.createElement('li');
          var label = entry.type === 'build'
            ? 'Build · ' + (entry.name || 'App') + ' · ' + entry.credits + ' credits'
            : (entry.type === 'topup' ? 'Credit top-up' : 'Subscription') + ' · +' + entry.credits + ' credits · ' + KilnWallet.money(entry.price);
          item.textContent = label;
          list.appendChild(item);
        });
        container.appendChild(listTitle);
        container.appendChild(list);
      }

      function fail(message) {
        error.hidden = false;
        error.textContent = message;
      }

      function choose(item, isTopup) {
        error.hidden = true;
        var address = input.value.trim();
        if (!validEmail(address)) {
          fail('Enter an email so the subscription has a name on this browser.');
          input.focus();
          return;
        }
        if (isTopup && !snap.active) {
          fail('Subscribe first. Credit top-ups are for subscribers.');
          return;
        }
        KilnWallet.setEmail(address);
        var url = KilnWallet.beginCheckout(isTopup ? 'topup' : 'plan', item.id);
        if (url) {
          location.href = url;
          return;
        }
        picked = { item: item, topup: !!isTopup };
        confirm.hidden = false;
        confirmCopy.textContent = isTopup
          ? 'Add ' + item.credits + ' credits for ' + KilnWallet.money(item.price) + '. No card is charged.'
          : 'Start ' + item.name + ' for ' + KilnWallet.money(item.price) + '. This adds ' + item.credits + ' credits for 30 days. No card is charged.';
        yes.focus();
      }

      function commit() {
        if (!picked) return;
        var result = picked.topup ? KilnWallet.topUp(picked.item.id) : KilnWallet.subscribe(picked.item.id);
        if (result.error === 'subscribe') {
          fail('Subscribe first.');
          return;
        }
        if (result.error) {
          fail('That plan could not be started.');
          return;
        }
        if (options.onChange) options.onChange();
        draw();
      }
    }

    draw();
  }

  window.KilnPlans = { mount: mount };
})();
