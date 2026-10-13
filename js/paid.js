(function () {
  KilnWallet.mount(document.getElementById('account-pill'));
  var params = new URLSearchParams(location.search);
  var plan = params.get('plan');
  var top = params.get('top');
  var box = document.getElementById('result');
  if (!plan && !top) {
    box.textContent = 'No payment was waiting in this browser.';
    return;
  }
  var result = KilnWallet.takePending(plan ? 'plan' : 'topup', plan || top);
  KilnWallet.mount(document.getElementById('account-pill'));
  if (result.error) {
    box.textContent = 'No matching payment was waiting in this browser, so no credits were added.';
    return;
  }
  var snap = KilnWallet.snapshot();
  box.textContent = 'Credits are on this browser. Balance: ' + snap.balance + '.';
})();
