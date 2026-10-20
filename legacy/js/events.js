// Events page: loads events from the server and shows upcoming and past ones
(function () {
  function el(tag, text) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    return e;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function fmt(iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function item(ev) {
    var li = el('li');
    var t = el('time', fmt(ev.date));
    t.setAttribute('datetime', ev.date);
    var box = el('span');
    box.appendChild(el('strong', ev.title));
    var meta = [ev.time, ev.location].filter(Boolean).join(' · ');
    if (meta) { box.appendChild(el('br')); var m = el('span', meta); m.className = 'meta'; box.appendChild(m); }
    if (ev.description) { box.appendChild(el('br')); box.appendChild(el('span', ev.description)); }
    li.appendChild(t);
    li.appendChild(box);
    return li;
  }
  function fill(list, events, emptyText) {
    list.textContent = '';
    if (!events.length && emptyText) list.appendChild(el('li', emptyText));
    events.forEach(function (ev) { list.appendChild(item(ev)); });
  }

  fetch('/api/events')
    .then(function (r) { return r.json(); })
    .then(function (events) {
      var now = today();
      var upcoming = events.filter(function (e) { return e.date >= now; });
      var past = events.filter(function (e) { return e.date < now; }).reverse();
      fill(document.getElementById('upcoming'), upcoming, 'No upcoming events yet. Please check back soon.');
      fill(document.getElementById('past'), past);
      document.getElementById('pastHeading').hidden = !past.length;
    })
    .catch(function () {
      document.getElementById('upcoming').innerHTML = '<li>Events could not be loaded. Please try again.</li>';
    });
})();
