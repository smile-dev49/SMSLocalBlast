const API = window.location.origin;
let step = 1;

function showStep(n) {
  step = n;
  document.querySelectorAll('.step-panel').forEach((p, i) => {
    p.style.display = i + 1 === step ? 'block' : 'none';
  });
  document.querySelectorAll('.step').forEach((s) => s.classList.toggle('active', parseInt(s.dataset.step) === step));
  document.getElementById('prev-btn').style.display = step > 1 ? 'inline-block' : 'none';
  document.getElementById('next-btn').style.display = step < 3 ? 'inline-block' : 'none';
  document.getElementById('submit-btn').style.display = step === 3 ? 'inline-block' : 'none';
  document.getElementById('install-error').style.display = 'none';
}

document.getElementById('next-btn').addEventListener('click', () => {
  if (step < 3) showStep(step + 1);
});
document.getElementById('prev-btn').addEventListener('click', () => {
  if (step > 1) showStep(step - 1);
});

document.getElementById('install-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('install-error');
  const okEl = document.getElementById('install-success');
  errEl.style.display = 'none';
  okEl.style.display = 'none';

  const form = e.target;
  const data = {
    supabase_url: form.supabase_url?.value?.trim(),
    supabase_service_key: form.supabase_service_key?.value?.trim(),
    supabase_anon_key: form.supabase_anon_key?.value?.trim(),
    site_name: form.site_name?.value?.trim() || 'SMS LocalBlast',
    support_email: form.support_email?.value?.trim(),
    primary_color: form.primary_color?.value?.trim() || '#1b4d89',
    admin_email: form.admin_email?.value?.trim(),
    admin_password: form.admin_password?.value,
  };

  try {
    const res = await fetch(`${API}/api/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) {
      okEl.textContent = json.message || 'Installation complete. Restart the server.';
      okEl.style.display = 'block';
      form.reset();
    } else {
      errEl.textContent = json.error + (json.detail ? `: ${json.detail}` : '');
      errEl.style.display = 'block';
    }
  } catch (err) {
    errEl.textContent = 'Network error: ' + err.message;
    errEl.style.display = 'block';
  }
});

fetch(`${API}/api/install/status`)
  .then((r) => r.json())
  .then((d) => {
    if (d.installed) {
      document.querySelector('.wizard').innerHTML = '<h1>Already installed</h1><p>SMS LocalBlast is configured. <a href="/admin">Go to Admin</a></p>';
    }
  })
  .catch(() => {});

showStep(1);
