/* global Office */

const API_BASE = window.location.origin;
const TOKEN_KEY = 'sms_localblast_token';
const EMAIL_KEY = 'sms_localblast_email';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function setUserEmail(email) {
  localStorage.setItem(EMAIL_KEY, (email || '').toLowerCase());
}

function getUserEmail() {
  return localStorage.getItem(EMAIL_KEY) || '';
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

function replaceTags(text, rowObj) {
  if (!text || typeof text !== 'string') return text;
  const tagMap = {};
  for (const [k, v] of Object.entries(rowObj || {})) {
    const key = String(k).trim();
    if (key) tagMap[key.toLowerCase()] = String(v ?? '').trim();
  }
  return text.replace(/\{\{([^}]+)\}\}/g, (match, tag) => {
    const val = tagMap[String(tag).trim().toLowerCase()];
    return val !== undefined ? val : match;
  });
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => { el.style.display = 'none'; });
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
  }
}

Office.onReady((info) => {
  if (info.host === Office.HostType.Excel) {
    init();
  }
});

function init() {
  if (getToken()) {
    showMain();
  } else {
    showLogin();
  }

  document.getElementById('login-form')?.addEventListener('submit', onLogin);
  document.getElementById('logout-btn')?.addEventListener('click', onLogout);
  document.getElementById('send-btn')?.addEventListener('click', onSend);
}

function showLogin() {
  showScreen('login-screen');
}

function showMain() {
  showScreen('main-screen');
  const emailEl = document.getElementById('user-email');
  emailEl.textContent = getUserEmail() === 'demo@localblast.com' ? 'Demo mode (no real SMS)' : 'Signed in';
}

async function onLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  showError('login-error');

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showError('login-error', data.error || 'Login failed');
      return;
    }

    setToken(data.token);
    setUserEmail(data.user?.email || email);
    showMain();
  } catch (err) {
    showError('login-error', 'Network error. Is the server running?');
    console.error(err);
  }
}

function onLogout() {
  clearToken();
  showLogin();
}

async function onSend() {
  const btn = document.getElementById('send-btn');
  const status = document.getElementById('send-status');
  btn.disabled = true;
  status.textContent = 'Reading sheet...';

  const token = getToken();
  if (!token) {
    status.textContent = 'Please sign in first.';
    btn.disabled = false;
    return;
  }

  try {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getUsedRange();
      range.load('values');
      await context.sync();

      const values = range.values || [];
      if (values.length < 1) {
        status.textContent = 'No data. Add Phone (col A) and Message (col B), with at least one row.';
        btn.disabled = false;
        return;
      }

      const hasHeader = values.length > 1;
      const headers = hasHeader ? (values[0] || []).map((h) => String(h ?? '').trim()) : ['Phone', 'Message'];
      const rows = hasHeader ? values.slice(1) : values;
      const rowOffset = hasHeader ? 2 : 1;

      const phoneCol = headers.findIndex((h) => /^phone$/i.test(h));
      const messageCol = headers.findIndex((h) => /^message$/i.test(h));
      const mediaCol = headers.findIndex((h) => /^media\s*url$/i.test(h));
      const pi = phoneCol >= 0 ? phoneCol : 0;
      const mi = messageCol >= 0 ? messageCol : 1;
      const ui = mediaCol >= 0 ? mediaCol : 2;

      const messages = rows
        .map((row, i) => {
          const rowObj = {};
          headers.forEach((h, idx) => {
            if (h) rowObj[h] = String(row[idx] ?? '').trim();
          });
          const phone = rowObj[headers[pi]] ?? String(row[pi] ?? '').trim();
          let body = rowObj[headers[mi]] ?? String(row[mi] ?? '').trim();
          const mediaUrl = rowObj[headers[ui]] ?? (row[ui] != null ? String(row[ui]).trim() : '');
          body = replaceTags(body, rowObj);
          return { phone, body, mediaUrl: mediaUrl || null, rowIndex: i + rowOffset };
        })
        .filter(m => m.phone && m.body);

      if (messages.length === 0) {
        status.textContent = 'No valid rows (Phone + Message required).';
        btn.disabled = false;
        return;
      }

      status.textContent = `Enqueueing ${messages.length} message(s)...`;

      let ok = 0;
      let fail = 0;
      let rateLimited = false;
      for (const m of messages) {
        try {
          const res = await fetch(`${API_BASE}/api/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              to_phone: m.phone,
              body: m.body,
              ...(m.mediaUrl && { media_url: m.mediaUrl }),
            }),
          });
          if (res.ok) ok++;
          else {
            const data = await res.json().catch(() => ({}));
            if (res.status === 429) {
              status.textContent = data.message || 'Rate limit exceeded (200 messages/hour). Try again later.';
              fail += messages.length - ok - fail;
              rateLimited = true;
              break;
            }
            fail++;
          }
        } catch {
          fail++;
        }
      }

      if (!rateLimited) {
        status.textContent = `Done. ${ok} enqueued.${fail ? ` ${fail} failed.` : ''}`;
      }
    });
  } catch (err) {
    status.textContent = 'Error reading sheet. Ensure Excel is ready.';
    console.error(err);
  }

  btn.disabled = false;
}