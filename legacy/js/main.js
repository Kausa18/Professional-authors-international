// Join form: sends details to the server (used on join.html)
var form = document.getElementById('joinForm');
if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = document.getElementById('formMsg');
    var data = Object.fromEntries(new FormData(form));
    try {
      var res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      var out = await res.json();
      msg.textContent = res.ok ? out.message : out.error;
      if (res.ok) form.reset();
    } catch (err) {
      msg.textContent = 'Could not reach the server. Please try again.';
    }
  });
}
