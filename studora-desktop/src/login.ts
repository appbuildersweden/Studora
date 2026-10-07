import {
  getSupabaseClient,
  roleLabel,
  signIn,
  fetchProfile,
  getSession,
} from './lib';

export function renderLogin(container: HTMLElement): void {
  container.innerHTML = `
    <div class="login-container">
      <div class="login-brand">
        <div class="login-logo">
          <svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="60" rx="8" fill="#12243a"/>
            <text x="100" y="38" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="white" letter-spacing="2">STUDORA</text>
          </svg>
        </div>
        <p class="login-tag">Skolplattform för elever, lärare och chefer</p>
      </div>

      <div class="login-card">
        <h1 class="login-title">Logga in</h1>
        <p class="login-sub">Ange ditt Studora-konto</p>

        <div class="login-fields">
          <div class="login-field">
            <label for="login-email">Studora-ID</label>
            <input id="login-email" type="text" autocomplete="username" placeholder="exempel" />
            <span class="login-hint">Ange ditt Studora-ID utan @studora.se</span>
          </div>

          <div class="login-field">
            <label for="login-password">Lösenord</label>
            <input id="login-password" type="password" autocomplete="current-password" />
          </div>
        </div>

        <div id="login-error" class="login-error hidden"></div>

        <button id="login-btn" class="login-btn" type="button">
          <span class="login-btn-text">Logga in</span>
          <span class="login-btn-spinner hidden"></span>
        </button>

        <div class="login-footer">
          <button id="forgot-link" class="link" type="button">Glömt lösenord?</button>
        </div>
      </div>

      <p class="login-bottom">© Studora – skolplattform</p>
    </div>
  `;

  const emailInput = document.getElementById('login-email') as HTMLInputElement;
  const passwordInput = document.getElementById('login-password') as HTMLInputElement;
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn') as HTMLButtonElement;
  const btnText = btn?.querySelector('.login-btn-text') as HTMLElement;
  const spinner = btn?.querySelector('.login-btn-spinner') as HTMLElement;
  const forgotLink = document.getElementById('forgot-link');

  forgotLink?.addEventListener('click', () => {
    showForgotPassword();
  });

  btn?.addEventListener('click', async () => {
    if (!emailInput || !passwordInput || !errorEl) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      showError('Ange din e-postadress eller Studora-ID.');
      emailInput.focus();
      return;
    }

    if (!password) {
      showError('Ange ditt lösenord.');
      passwordInput.focus();
      return;
    }

    setLoading(true);
    errorEl.classList.add('hidden');
    errorEl.textContent = '';

    const result = await signIn(email, password);

    if (result.error?.includes('Invalid login credentials') || result.error?.includes('Invalid email') || result.error?.includes('Invalid password')) {
      showError('Fel Studora-ID eller lösenord.');
      setLoading(false);
      return;
    }

    if (result.error) {
      setLoading(false);
      showError(result.error);
      return;
    }

    setLoading(false);

    await navigateToApp();
  });

  emailInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      passwordInput?.focus();
    }
  });

  passwordInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      btn?.click();
    }
  });

  emailInput?.focus();
}

function showError(message: string): void {
  const errorEl = document.getElementById('login-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

function setLoading(loading: boolean): void {
  const btn = document.getElementById('login-btn') as HTMLButtonElement;
  const btnText = btn?.querySelector('.login-btn-text') as HTMLElement;
  const spinner = btn?.querySelector('.login-btn-spinner') as HTMLElement;

  if (loading) {
    btn?.setAttribute('disabled', 'true');
    btnText?.classList.add('hidden');
    spinner?.classList.remove('hidden');
  } else {
    btn?.removeAttribute('disabled');
    btnText?.classList.remove('hidden');
    spinner?.classList.add('hidden');
  }
}

async function navigateToApp(): Promise<void> {
  const supabase = getSupabaseClient();

  const { profile, error } = await fetchProfile();

  if (error || !profile) {
    showError('Kunde inte läsa din profil.');
    return;
  }

  const role = profile.role as string;
  const name = profile.full_name || profile.username || 'Användare';

  window.location.hash = `#/app?name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}`;
  window.location.reload();
}

function showForgotPassword(): void {
  const email = (document.getElementById('login-email') as HTMLInputElement)?.value.trim() || '';

  if (!email) {
    showError('Ange din e-postadress först.');
    return;
  }

  const supabase = getSupabaseClient();

  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset.html',
  }).then(({ error }) => {
    if (error) {
      showError('Kunde inte skicka återställningslänken. Försök igen.');
    } else {
      showError('Om e-postadressen är registrerad har vi skickat en återställningslänk.');
    }
  });
}
