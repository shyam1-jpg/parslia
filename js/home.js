(function () {
  var examples = [
    ['Logbook', 'Lighthouse keeper', 'A lighthouse keeper app to log lamp oil, foghorn tests, weather, and supply boats'],
    ['Animals', 'Beekeeping', 'Beekeeping app with hives, inspections, honey harvests, and queen notes'],
    ['Shop', 'Candle company', 'A shop for Harbour Candle Co selling cedar candle, linen spray, and match tin'],
    ['School', 'Planets quiz', 'Quiz app for year 5 science about planets'],
    ['Work', 'Plumbing jobs', 'A client tracker for a plumbing company with jobs, quotes, and a contact form'],
    ['Tool', 'Bread timer', 'A countdown timer for bread baking'],
    ['Collection', 'Tram tickets', 'An app for cataloguing vintage tram tickets in Lisbon'],
    ['Clinic', 'Patient book', 'A clinic app for appointments and patient notes']
  ];

  KilnWallet.mount(document.getElementById('account-pill'));

  var grid = document.getElementById('examples');
  examples.forEach(function (example) {
    var link = document.createElement('a');
    link.className = 'example';
    link.href = 'studio.html?prompt=' + encodeURIComponent(example[2]);
    var kicker = document.createElement('span');
    kicker.className = 'kicker';
    kicker.textContent = example[0];
    var title = document.createElement('strong');
    title.textContent = example[1];
    var copy = document.createElement('p');
    copy.textContent = example[2];
    link.appendChild(kicker);
    link.appendChild(title);
    link.appendChild(copy);
    grid.appendChild(link);
  });

  KilnPlans.mount(document.getElementById('plans'), { topups: false, onChange: function () {
    KilnWallet.mount(document.getElementById('account-pill'));
    location.href = 'studio.html';
  } });
})();
