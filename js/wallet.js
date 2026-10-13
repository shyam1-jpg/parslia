(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.KilnWallet = api.browser();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var DAY_MS = 24 * 60 * 60 * 1000;
  var TERM_DAYS = 30;
  var KEY = 'kiln.account.v1';
  var PENDING = 'kiln.pending';

  var PLANS = [
    { id: 'starter', name: 'Starter', price: 19, credits: 80, blurb: 'For one person building their own apps.' },
    { id: 'studio', name: 'Studio', price: 49, credits: 250, blurb: 'For a business that will build several apps.', popular: true },
    { id: 'works', name: 'Works', price: 119, credits: 700, blurb: 'For someone building apps for clients.' }
  ];

  var TOPUPS = [
    { id: 'top-100', name: '100 credits', price: 25, credits: 100, blurb: 'A few more builds on the current plan.' },
    { id: 'top-300', name: '300 credits', price: 65, credits: 300, blurb: 'A larger block of builds and revisions.' }
  ];

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function planById(id) {
    return PLANS.filter(function (plan) { return plan.id === id; })[0] || null;
  }

  function topupById(id) {
    return TOPUPS.filter(function (pack) { return pack.id === id; })[0] || null;
  }

  function freshState() {
    return { email: '', subscription: null, entries: [], apps: [] };
  }

  function balance(state) {
    return (state.entries || []).reduce(function (sum, entry) {
      return sum + Number(entry.credits || 0);
    }, 0);
  }

  function daysLeft(state, now) {
    if (!state.subscription) return 0;
    return Math.max(0, Math.ceil((state.subscription.until - now) / DAY_MS));
  }

  function subscribed(state, now) {
    return !!(state.subscription && state.subscription.until > now);
  }

  function canBuild(state, cost, now) {
    if (!subscribed(state, now)) return { ok: false, reason: 'subscribe' };
    if (balance(state) < cost) return { ok: false, reason: 'credits' };
    return { ok: true, reason: '' };
  }

  function subscribe(state, planId, now) {
    var plan = planById(planId);
    if (!plan) return { state: state, error: 'plan' };
    var base = state.subscription && state.subscription.until > now ? state.subscription.until : now;
    return {
      state: {
        email: state.email,
        subscription: { plan: plan.id, until: base + TERM_DAYS * DAY_MS, started: now },
        entries: state.entries.concat([{
          id: uid(), type: 'subscription', plan: plan.id, credits: plan.credits, price: plan.price, at: now
        }]),
        apps: state.apps.slice()
      },
      error: ''
    };
  }

  function topUp(state, topId, now) {
    if (!subscribed(state, now)) return { state: state, error: 'subscribe' };
    var pack = topupById(topId);
    if (!pack) return { state: state, error: 'plan' };
    return {
      state: {
        email: state.email,
        subscription: state.subscription,
        entries: state.entries.concat([{
          id: uid(), type: 'topup', pack: pack.id, credits: pack.credits, price: pack.price, at: now
        }]),
        apps: state.apps.slice()
      },
      error: ''
    };
  }

  function spend(state, cost, app, now) {
    var gate = canBuild(state, cost, now);
    if (!gate.ok) return { state: state, error: gate.reason };
    var id = uid();
    return {
      state: {
        email: state.email,
        subscription: state.subscription,
        entries: state.entries.concat([{
          id: id, type: 'build', credits: -Math.abs(cost), at: now, name: app.name
        }]),
        apps: state.apps.concat([{
          id: id,
          name: app.name,
          prompt: app.prompt,
          html: app.html,
          cost: cost,
          screens: app.screens || [],
          at: now
        }]).slice(-15)
      },
      error: ''
    };
  }

  function completePending(state, pending, request, now) {
    if (!pending || pending.id !== request.id || pending.kind !== request.kind) {
      return { state: state, error: 'missing' };
    }
    if (request.kind === 'plan') return subscribe(state, request.id, now);
    if (request.kind === 'topup') return topUp(state, request.id, now);
    return { state: state, error: 'missing' };
  }

  function withEmail(state, email) {
    return {
      email: String(email || '').trim(),
      subscription: state.subscription,
      entries: state.entries.slice(),
      apps: state.apps.slice()
    };
  }

  function paymentUrl(id) {
    var links = (typeof globalThis !== 'undefined' && globalThis.KILN_PAYMENTS && globalThis.KILN_PAYMENTS.links) || {};
    var url = links[id] || '';
    return /^https:\/\//.test(url) ? url : '';
  }

  function browser() {
    function load() {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return freshState();
        var parsed = JSON.parse(raw);
        return {
          email: parsed.email || '',
          subscription: parsed.subscription || null,
          entries: parsed.entries || [],
          apps: parsed.apps || []
        };
      } catch (err) {
        return freshState();
      }
    }

    function save(state) {
      var copy = {
        email: state.email,
        subscription: state.subscription,
        entries: state.entries,
        apps: state.apps
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(copy));
      } catch (err) {
        copy.apps = copy.apps.slice(-5);
        localStorage.setItem(KEY, JSON.stringify(copy));
      }
      return copy;
    }

    function snapshot() {
      var state = load();
      var now = Date.now();
      return {
        email: state.email,
        balance: balance(state),
        days: daysLeft(state, now),
        active: subscribed(state, now),
        plan: state.subscription ? planById(state.subscription.plan) : null,
        apps: state.apps,
        entries: state.entries.slice().reverse()
      };
    }

    return {
      plans: PLANS,
      topups: TOPUPS,
      money: function (amount) { return '£' + amount; },
      snapshot: snapshot,
      setEmail: function (email) { save(withEmail(load(), email)); },
      canBuild: function (cost) { return canBuild(load(), cost, Date.now()); },
      subscribe: function (planId) {
        var result = subscribe(load(), planId, Date.now());
        if (!result.error) save(result.state);
        return result;
      },
      topUp: function (topId) {
        var result = topUp(load(), topId, Date.now());
        if (!result.error) save(result.state);
        return result;
      },
      spend: function (cost, app) {
        var result = spend(load(), cost, app, Date.now());
        if (!result.error) save(result.state);
        return result;
      },
      beginCheckout: function (kind, id) {
        var url = paymentUrl(id);
        if (!url) return '';
        localStorage.setItem(PENDING, JSON.stringify({ kind: kind, id: id, at: Date.now() }));
        return url;
      },
      takePending: function (kind, id) {
        var raw = localStorage.getItem(PENDING);
        localStorage.removeItem(PENDING);
        if (!raw) return { error: 'missing' };
        var result = completePending(load(), JSON.parse(raw), { kind: kind, id: id }, Date.now());
        if (!result.error) save(result.state);
        return result;
      },
      mount: function (el) {
        if (!el) return;
        var snap = snapshot();
        el.textContent = '';
        var link = document.createElement('a');
        link.href = 'pricing.html';
        link.textContent = snap.active
          ? snap.plan.name + ' · ' + snap.balance + ' credits · ' + snap.days + ' days'
          : 'Subscribe';
        el.appendChild(link);
      }
    };
  }

  return {
    DAY_MS: DAY_MS,
    TERM_DAYS: TERM_DAYS,
    PLANS: PLANS,
    TOPUPS: TOPUPS,
    freshState: freshState,
    balance: balance,
    daysLeft: daysLeft,
    subscribed: subscribed,
    canBuild: canBuild,
    subscribe: subscribe,
    topUp: topUp,
    spend: spend,
    completePending: completePending,
    withEmail: withEmail,
    planById: planById,
    browser: browser
  };
});
