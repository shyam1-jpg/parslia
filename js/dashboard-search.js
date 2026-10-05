/* Search only the public navigation links rendered on this dashboard. */
(function (root) {
  'use strict';
  function normalise(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function search(items, query) {
    var terms = normalise(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return items.filter(function (item) {
      var text = normalise(item.title + ' ' + item.group + ' ' + item.keywords);
      return terms.every(function (term) { return text.includes(term); });
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { normalise: normalise, search: search };
  if (!root.document) return;
  var document = root.document;
  var input = document.getElementById('dashboard-search');
  if (!input) return;
  var results = document.getElementById('search-results');
  var status = document.getElementById('search-status');
  var seen = new Set();
  var items = [];
  document.querySelectorAll('main section:not(.dashboard-search) a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href || /^(?:[a-z]+:|\/\/)/i.test(href) || seen.has(href)) return;
    seen.add(href);
    var section = link.closest('section');
    var card = link.closest('article');
    var heading = card && card.querySelector('h3');
    var text = link.textContent.trim();
    if (heading && /^(open sop|open equipment procedure)/i.test(text)) text = heading.textContent + ' · procedure';
    items.push({ href: href, title: text, group: section.querySelector('h2')?.textContent || 'Kitchen workspace', keywords: href + ' ' + (heading?.textContent || '') });
  });
  function render() {
    var matches = search(items, input.value);
    results.replaceChildren();
    results.hidden = !matches.length;
    if (!input.value.trim()) { status.textContent = ''; return; }
    status.textContent = matches.length ? matches.length + ' matching ' + (matches.length === 1 ? 'link.' : 'links.') : 'No matching links. Try an equipment name, a procedure code such as KP-04, or forms.';
    matches.forEach(function (item) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      var title = document.createElement('strong');
      var group = document.createElement('small');
      a.href = item.href;
      title.textContent = item.title;
      group.textContent = item.group;
      a.append(title, group);
      li.append(a);
      results.append(li);
    });
  }
  function clear() { input.value = ''; render(); input.focus(); }
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (event) { if (event.key === 'Escape') clear(); });
  document.getElementById('clear-search').addEventListener('click', clear);
  input.closest('.dashboard-search').hidden = false;
})(typeof window !== 'undefined' ? window : {});
