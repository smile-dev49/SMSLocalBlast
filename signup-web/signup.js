(function () {
  const form = document.getElementById('signup-form');
  const errorEl = document.getElementById('error');
  const API = window.location.origin;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const terms = document.getElementById('terms').checked;

    if (!terms) {
      errorEl.textContent = 'You must agree to the Terms of Service and Privacy Policy';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const res = await fetch(API + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, terms_accepted: true }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = '/admin?registered=1';
      } else {
        errorEl.textContent = data.error || 'Registration failed';
        errorEl.style.display = 'block';
      }
    } catch (err) {
      errorEl.textContent = 'Network error. Is the server running?';
      errorEl.style.display = 'block';
    }
  });
})();
