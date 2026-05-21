document.addEventListener('DOMContentLoaded', () => {
  if (AppState.isAdmin()) {
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-pass');
  const errEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const toggleBtn = document.getElementById('toggle-pass');

  const ADMIN = { email: 'admin@streamflix.com', password: 'admin123', name: 'Admin', role: 'admin' };
  const DEMO  = { email: 'demo@streamflix.com',  password: 'demo123',  name: 'Usuário Demo', role: 'user' };

  toggleBtn.addEventListener('click', () => {
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
    toggleBtn.textContent = type === 'password' ? '👁' : '🙈';
  });

  const showError = (msg) => {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
    emailInput.closest('.form-group').querySelector('.form-input')?.classList.add('input-error');
  };

  const clearError = () => {
    errEl.classList.add('hidden');
  };

  [emailInput, passInput].forEach(el => el.addEventListener('input', clearError));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const pass = passInput.value;

    if (!email || !pass) {
      showError('Preencha todos os campos.');
      return;
    }

    submitBtn.textContent = 'Entrando...';
    submitBtn.disabled = true;

    setTimeout(() => {
      let user = null;
      if (email === ADMIN.email && pass === ADMIN.password) user = ADMIN;
      else if (email === DEMO.email && pass === DEMO.password) user = DEMO;

      if (user) {
        AppState.saveUser(user);
        UI.showToast(`Bem-vindo, ${user.name}!`, 'success');
        setTimeout(() => {
          window.location.href = user.role === 'admin' ? 'config.html' : 'index.html';
        }, 700);
      } else {
        showError('E-mail ou senha incorretos.');
        submitBtn.textContent = 'Entrar';
        submitBtn.disabled = false;
      }
    }, 600);
  });

  document.querySelectorAll('.demo-hint').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      if (type === 'admin') {
        emailInput.value = ADMIN.email;
        passInput.value = ADMIN.password;
      } else {
        emailInput.value = DEMO.email;
        passInput.value = DEMO.password;
      }
      clearError();
    });
  });
});
