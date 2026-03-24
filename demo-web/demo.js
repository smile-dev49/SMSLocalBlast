(function () {
  const API = window.location.origin;
  const ROWS = [
    { phone: '+1 555-0001', msg: 'Hi {{Name}}, your balance is {{Balance}}', name: 'Alice', balance: '$50' },
    { phone: '+1 555-0002', msg: 'Hi {{Name}}, your balance is {{Balance}}', name: 'Bob', balance: '$75' },
    { phone: '+1 555-0003', msg: 'Hi {{Name}}, your balance is {{Balance}}', name: 'Carol', balance: '$120' },
  ];

  const formEl = document.getElementById('demo-form');
  const progressEl = document.getElementById('demo-progress');
  const doneEl = document.getElementById('demo-done');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressLog = document.getElementById('progress-log');
  const sendBtn = document.getElementById('send-demo-btn');
  const pitchModal = document.getElementById('pitch-modal');
  const closePitch = document.getElementById('close-pitch');

  function replaceTags(text, row) {
    return text
      .replace(/\{\{Name\}\}/g, row.name || '')
      .replace(/\{\{Balance\}\}/g, row.balance || '');
  }

  function addLog(msg) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = msg;
    progressLog.appendChild(line);
    progressLog.scrollTop = progressLog.scrollHeight;
  }

  async function runDemo() {
    sendBtn.disabled = true;
    formEl.style.display = 'none';
    progressEl.style.display = 'block';
    doneEl.style.display = 'none';
    progressLog.innerHTML = '';
    progressFill.style.width = '0%';

    let token = null;
    try {
      const loginRes = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@localblast.com', password: 'demo' }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.token) {
        token = loginData.token;
      }
    } catch {
      addLog('(Server unavailable — simulating locally)');
    }

    const total = ROWS.length;
    for (let i = 0; i < total; i++) {
      const row = ROWS[i];
      const body = replaceTags(row.msg, row);
      const pct = ((i + 1) / total) * 100;
      progressFill.style.width = pct + '%';
      progressText.textContent = `Sending ${i + 1} of ${total}...`;
      addLog(`→ ${row.phone}: "${body.slice(0, 40)}..."`);

      if (token) {
        try {
          await fetch(`${API}/api/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + token,
            },
            body: JSON.stringify({ to_phone: row.phone, body }),
          });
        } catch {
          addLog('  (simulated)');
        }
      }
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    }

    progressFill.style.width = '100%';
    progressText.textContent = 'Done!';
    addLog('✓ All messages sent (demo — no real SMS)');

    progressEl.style.display = 'none';
    doneEl.style.display = 'block';
    sendBtn.disabled = false;

    setTimeout(() => {
      pitchModal.style.display = 'flex';
    }, 800);
  }

  sendBtn?.addEventListener('click', runDemo);
  closePitch?.addEventListener('click', () => {
    pitchModal.style.display = 'none';
  });
  pitchModal?.addEventListener('click', (e) => {
    if (e.target === pitchModal) pitchModal.style.display = 'none';
  });
})();
