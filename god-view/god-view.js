/* global location */

const API_BASE = location.origin;
const TOKEN_KEY = 'sms_localblast_god_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((el) => { el.style.display = 'none'; });
  const el = document.getElementById(id);
  if (el) el.style.display = id === 'login-screen' ? 'flex' : 'block';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
  }
}

async function api(path, opts = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opts.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = res.ok ? await res.json().catch(() => ({})) : await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

function init() {
  if (getToken()) {
    showDashboard();
    loadDashboard();
  } else {
    showLogin();
  }

  document.getElementById('login-form')?.addEventListener('submit', onLogin);
  document.getElementById('logout-btn')?.addEventListener('click', onLogout);
}

async function onLogin(e) {
  e.preventDefault();
  const secret = document.getElementById('secret').value.trim();
  showError('login-error');

  if (!secret) {
    showError('login-error', 'Enter your secret');
    return;
  }

  setToken(secret);
  try {
    await api('/api/v1/god/stats');
    showDashboard();
    loadDashboard();
  } catch (err) {
    setToken('');
    showError('login-error', err.error || 'Invalid secret');
  }
}

function onLogout() {
  setToken('');
  showLogin();
}

function showLogin() {
  showScreen('login-screen');
}

function showDashboard() {
  showScreen('dashboard-screen');
}

async function loadDashboard() {
  const token = getToken();
  if (!token) return;

  try {
    const [stats, licensesData] = await Promise.all([
      api('/api/v1/god/stats'),
      api('/api/v1/god/licenses'),
    ]);

    document.getElementById('stat-total').textContent = stats.total ?? '—';
    document.getElementById('stat-active').textContent = stats.active ?? '—';
    document.getElementById('stat-activated').textContent = stats.activated ?? '—';
    document.getElementById('stat-revoked').textContent = stats.revoked ?? '—';

    const tbody = document.getElementById('licenses-tbody');
    const list = licensesData.licenses || [];
    tbody.innerHTML = list.length
      ? list.map(
          (l) =>
            `<tr>
              <td><code>${escapeHtml(maskCode(l.purchase_code))}</code></td>
              <td>${escapeHtml(l.buyer_username || '—')}</td>
              <td>${escapeHtml(l.activated_domain || '—')}</td>
              <td><span class="badge badge-${l.status}">${escapeHtml(l.status)}</span></td>
              <td>${formatDate(l.last_check_in)}</td>
              <td>${l.status === 'active' ? `<button class="btn btn-danger btn-sm" data-code="${escapeHtml(l.purchase_code)}">Revoke</button>` : '—'}</td>
            </tr>`
        ).join('')
      : '<tr><td colspan="6" class="muted">No licenses</td></tr>';

    tbody.querySelectorAll('.btn-danger').forEach((btn) => {
      btn.addEventListener('click', () => onRevoke(btn.dataset.code));
    });
  } catch (err) {
    if (err.status === 401) {
      setToken('');
      showLogin();
      return;
    }
    document.getElementById('licenses-tbody').innerHTML =
      '<tr><td colspan="6" class="muted">Error loading data</td></tr>';
  }
}

function maskCode(code) {
  if (!code || code.length < 12) return code || '—';
  return code.slice(0, 8) + '…' + code.slice(-4);
}

async function onRevoke(purchaseCode) {
  if (!confirm('Revoke this license? The client will stop on next check-in.')) return;

  try {
    await api('/api/v1/revoke-license', {
      method: 'POST',
      body: JSON.stringify({ purchase_code: purchaseCode }),
    });
    loadDashboard();
  } catch (err) {
    alert(err.error || err.reason || 'Revoke failed');
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function formatDate(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

init();
