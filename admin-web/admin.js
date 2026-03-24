/* global location */

const API_BASE = location.origin;
const TOKEN_KEY = 'sms_localblast_admin_token';
const EMAIL_KEY = 'sms_localblast_admin_email';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function setUserEmail(email) {
  localStorage.setItem(EMAIL_KEY, email || '');
}

function getUserEmail() {
  return localStorage.getItem(EMAIL_KEY) || '';
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
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
  document.getElementById('update-btn')?.addEventListener('click', onUpdate);
  document.getElementById('create-api-key-btn')?.addEventListener('click', onCreateApiKey);
  document.getElementById('brand-form')?.addEventListener('submit', onSaveBrand);
}

async function onLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  showError('login-error');

  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.user?.role !== 'admin') {
      clearSession();
      showError('login-error', 'Admin access required. This account is not an admin.');
      return;
    }

    setToken(data.token);
    setUserEmail(data.user?.email || email);
    showDashboard();
    loadDashboard();
  } catch (err) {
    showError('login-error', err.error || err.message || 'Login failed');
  }
}

function onLogout() {
  clearSession();
  showLogin();
}

function showLogin() {
  showScreen('login-screen');
}

function showDashboard() {
  showScreen('dashboard-screen');
  document.getElementById('admin-email').textContent = getUserEmail();
}

async function loadDashboard() {
  const token = getToken();
  if (!token) return;

  try {
    const [stats, users, apiKeys, brand, health, updateCheck] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/users'),
      api('/api/admin/api-keys').catch(() => ({ apiKeys: [] })),
      api('/api/admin/brand').catch(() => ({})),
      fetch(`${API_BASE}/api/health`).then((r) => r.json()).catch(() => ({ error: 'Failed to fetch' })),
      fetch(`${API_BASE}/api/update-check`).then((r) => r.json()).catch(() => ({ update_available: false })),
    ]);

    document.getElementById('stat-users').textContent = stats.users?.total ?? '—';
    document.getElementById('stat-devices').textContent = stats.devices?.active ?? '—';
    document.getElementById('stat-messages').textContent = stats.messages?.total ?? '—';
    document.getElementById('stat-pending').textContent = stats.messages?.pending ?? '—';
    document.getElementById('stat-sent').textContent = stats.messages?.sent ?? '—';
    document.getElementById('stat-failed').textContent = stats.messages?.failed ?? '—';

    const tbody = document.getElementById('users-tbody');
    const userList = users.users || [];
    tbody.innerHTML = userList.length
      ? userList.map(
          (u) =>
            `<tr><td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.role)}</td><td>${formatDate(u.created_at)}</td></tr>`
        ).join('')
      : '<tr><td colspan="3" class="muted">No users</td></tr>';

    const userSelect = document.getElementById('api-key-user');
    if (userSelect) {
      userSelect.innerHTML = '<option value="">Select user…</option>' +
        userList.map((u) =>
          `<option value="${escapeHtml(u.id)}">${escapeHtml(u.email)}</option>`
        ).join('');
    }

    const keysTbody = document.getElementById('api-keys-tbody');
    const keys = apiKeys.apiKeys || [];
    keysTbody.innerHTML = keys.length
      ? keys.map((k) =>
          `<tr>
            <td>${escapeHtml(k.user_email || '—')}</td>
            <td>${escapeHtml(k.name)}</td>
            <td><code>${escapeHtml(k.key_prefix)}</code></td>
            <td>${formatDate(k.created_at)}</td>
            <td><button class="btn btn-danger btn-sm" data-id="${escapeHtml(k.id)}">Revoke</button></td>
          </tr>`
        ).join('')
      : '<tr><td colspan="5" class="muted">No API keys</td></tr>';

    keysTbody.querySelectorAll('.btn-danger').forEach((btn) => {
      btn.addEventListener('click', () => onRevokeApiKey(btn.dataset.id));
    });

    document.getElementById('brand-site-name').value = brand.site_name || '';
    document.getElementById('brand-support-email').value = brand.support_email || '';
    document.getElementById('brand-primary-color').value = brand.primary_color || '#1b4d89';

    document.getElementById('health-data').textContent = JSON.stringify(health, null, 2);

    const updateBanner = document.getElementById('update-available-banner');
    if (updateBanner) {
      updateBanner.style.display = updateCheck.update_available ? 'block' : 'none';
      const verEl = document.getElementById('update-available-version');
      if (verEl) verEl.textContent = updateCheck.latest_version || '';
    }
  } catch (err) {
    if (err.status === 403) {
      clearSession();
      showLogin();
      return;
    }
    document.getElementById('users-tbody').innerHTML =
      '<tr><td colspan="3" class="muted">Error loading data</td></tr>';
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

async function onCreateApiKey() {
  const userId = document.getElementById('api-key-user')?.value;
  const name = document.getElementById('api-key-name')?.value?.trim() || 'Default';
  const secretEl = document.getElementById('api-key-secret');
  const valueEl = document.getElementById('api-key-secret-value');
  secretEl.style.display = 'none';

  if (!userId) {
    alert('Select a user');
    return;
  }

  try {
    const data = await api('/api/admin/api-keys', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, name }),
    });
    valueEl.textContent = data.secret;
    secretEl.style.display = 'block';
    loadDashboard();
  } catch (err) {
    alert(err.error || 'Failed to create API key');
  }
}

async function onRevokeApiKey(id) {
  if (!confirm('Revoke this API key? It will stop working immediately.')) return;
  try {
    await api(`/api/admin/api-keys/${id}`, { method: 'DELETE' });
    loadDashboard();
  } catch (err) {
    alert(err.error || 'Failed to revoke');
  }
}

async function onSaveBrand(e) {
  e.preventDefault();
  const siteName = document.getElementById('brand-site-name')?.value?.trim();
  const supportEmail = document.getElementById('brand-support-email')?.value?.trim();
  const primaryColor = document.getElementById('brand-primary-color')?.value?.trim();
  try {
    await api('/api/admin/brand', {
      method: 'PATCH',
      body: JSON.stringify({
        site_name: siteName,
        support_email: supportEmail,
        primary_color: primaryColor,
      }),
    });
    alert('Brand settings saved');
  } catch (err) {
    alert(err.error || 'Failed to save');
  }
}

async function onUpdate() {
  const btn = document.getElementById('update-btn');
  const status = document.getElementById('update-status');
  btn.disabled = true;
  status.textContent = 'Updating…';
  status.className = 'update-status';

  try {
    const data = await api('/api/admin/update', { method: 'POST' });
    status.textContent = data.message || 'Update complete.';
    status.className = 'update-status success';
    if (data.pm2Restart) {
      status.textContent += ' Server restarting…';
      setTimeout(() => location.reload(), 3000);
    }
  } catch (err) {
    status.textContent = err.error || err.detail || 'Update failed';
    status.className = 'update-status error';
  } finally {
    btn.disabled = false;
  }
}

init();
