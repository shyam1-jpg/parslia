(function () {
  KilnWallet.mount(document.getElementById('account-pill'));
  KilnPlans.mount(document.getElementById('plans'), {
    topups: true,
    onChange: function () { KilnWallet.mount(document.getElementById('account-pill')); }
  });
})();
