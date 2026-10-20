// Admin page: log in, then add, edit and delete events
var $ = function (id) { return document.getElementById(id); };
var editingId = null;

function api(method, url, body) {
  return fetch(url, {
    method: method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (data) {
      if (!r.ok) throw new Error(data.error || 'Something went wrong.');
      return data;
    });
  });
}

function show(isAdmin) {
  $('login').hidden = isAdmin;
  $('dashboard').hidden = !isAdmin;
  if (isAdmin) loadEvents();
}

function resetForm() {
  editingId = null;
  $('eventForm').reset();
  $('formTitle').textContent = 'Add an event';
  $('saveBtn').textContent = 'Add event';
  $('cancelBtn').hidden = true;
}

function loadEvents() {
  api('GET', '/api/events').then(function (events) {
    var list = $('adminList');
    list.textContent = '';
    if (!events.length) {
      var empty = document.createElement('li');
      empty.textContent = 'No events yet. Add the first one above.';
      list.appendChild(empty);
    }
    events.forEach(function (ev) {
      var li = document.createElement('li');
      var info = document.createElement('div');
      var strong = document.createElement('strong');
      strong.textContent = ev.title;
      var small = document.createElement('small');
      small.textContent = [ev.date, ev.time, ev.location].filter(Boolean).join(' · ');
      info.appendChild(strong);
      info.appendChild(small);

      var actions = document.createElement('div');
      var edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Edit';
      edit.onclick = function () {
        editingId = ev.id;
        $('title').value = ev.title;
        $('date').value = ev.date;
        $('time').value = ev.time || '';
        $('location').value = ev.location || '';
        $('description').value = ev.description || '';
        $('formTitle').textContent = 'Edit event';
        $('saveBtn').textContent = 'Save changes';
        $('cancelBtn').hidden = false;
        $('formMsg').textContent = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'danger';
      del.textContent = 'Delete';
      del.onclick = function () {
        if (!confirm('Delete "' + ev.title + '"?')) return;
        api('DELETE', '/api/events/' + ev.id).then(function () {
          if (editingId === ev.id) resetForm();
          loadEvents();
        }).catch(function (err) { alert(err.message); });
      };
      actions.appendChild(edit);
      actions.appendChild(del);
      li.appendChild(info);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }).catch(function (err) { $('formMsg').textContent = err.message; });
}

$('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  api('POST', '/api/admin/login', { password: $('password').value })
    .then(function () { $('password').value = ''; $('loginMsg').textContent = ''; show(true); })
    .catch(function (err) { $('loginMsg').textContent = err.message; });
});

$('eventForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var data = {
    title: $('title').value,
    date: $('date').value,
    time: $('time').value,
    location: $('location').value,
    description: $('description').value
  };
  var request = editingId ? api('PUT', '/api/events/' + editingId, data) : api('POST', '/api/events', data);
  request.then(function () {
    var wasEditing = !!editingId;
    resetForm();
    $('formMsg').textContent = wasEditing ? 'Changes saved.' : 'Event added.';
    loadEvents();
  }).catch(function (err) { $('formMsg').textContent = err.message; });
});

$('cancelBtn').addEventListener('click', function () { resetForm(); $('formMsg').textContent = ''; });
$('logoutBtn').addEventListener('click', function () {
  api('POST', '/api/admin/logout').then(function () { resetForm(); show(false); });
});

api('GET', '/api/admin/session').then(function (s) { show(s.admin); }).catch(function () { show(false); });
