import { roleLabel, fetchProfile, signOut, isChef, isLarare, getSupabaseClient } from './lib';

// Auto-update notifiering
function setupAutoUpdateNotifier(container: HTMLElement): void {
  if (window.electronAPI) {
    window.electronAPI.onAppQuitting(() => {});

    window.electronAPI.log('Auto-update notifiering initierad');
  }
}

export function renderApp(container: HTMLElement, userName: string, userRole: string): void {
  setupAutoUpdateNotifier(container);
  const isChefRole = isChef(userRole);
  const isLarareRole = isLarare(userRole);

  container.innerHTML = `
    <div class="app-layout">
      <header class="app-header">
        <div class="app-brand">
          <svg class="app-logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="60" rx="8" fill="#12243a"/>
            <text x="100" y="38" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="white" letter-spacing="2">STUDORA</text>
          </svg>
        </div>

        <div class="app-search">
          <input type="text" class="search-input" placeholder="Sök i Studora..." />
          <button class="search-btn" type="button">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>

        <div class="app-user">
          <div class="user-avatar">
            ${getInitials(userName)}
          </div>
          <div class="user-info">
            <span class="user-name">${escapeHtml(userName)}</span>
            <span class="user-role-label">${roleLabel(userRole)}</span>
          </div>
        </div>
      </header>

      <div class="app-body">
        <nav class="app-sidebar">
          <ul class="sidebar-menu">
            <li class="menu-item active">
              <a href="#/app" data-view="dashboard">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Hem</span>
              </a>
            </li>
            ${renderSidebarItems(isChefRole, isLarareRole, userRole)}
          </ul>

          <div class="sidebar-footer">
            <button id="logout-btn" class="logout-btn" type="button">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Logga ut</span>
            </button>
          </div>
        </nav>

        <main class="app-content">
          <div class="dashboard-header">
            <h1>Välkommen till Studora</h1>
            <p class="dashboard-sub">${escapeHtml(userName)} · ${roleLabel(userRole)}</p>
          </div>

          <div class="dashboard-grid">
            <div class="card dashboard-card welcome-card">
              <h2>Din session är aktiv</h2>
              <p>Du är inloggad på Studora som ${roleLabel(userRole)}.</p>
              <div class="role-badge role-${userRole}">
                ${roleLabel(userRole)}
              </div>
            </div>

            ${isChefRole ? renderChefPanel() : ''}
            ${isLarareRole && !isChefRole ? renderLararePanel() : ''}
            ${userRole === 'elev' ? renderElevPanel() : ''}
          </div>

          <div class="quick-actions">
            <h3>Snabblatt</h3>
            <div class="quick-actions-grid">
              <button class="quick-action-btn" type="button">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Användare</span>
              </button>
              <button class="quick-action-btn" type="button">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Dokument</span>
              </button>
              <button class="quick-action-btn" type="button">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Kalender</span>
              </button>
              <button class="quick-action-btn" type="button">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <span>Notiser</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', async () => {
    await signOut();
    window.location.hash = '#/login';
    window.location.reload();
  });

  setupSidebarNavigation(container);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderSidebarItems(isChefRole: boolean, isLarareRole: boolean, role: string): string {
  const items: Array<{ icon: string; label: string; role: string[] }> = [
    { icon: 'kurser', label: 'Kurser', role: ['chef', 'lärare', 'elev'] },
    { icon: 'uppgifter', label: 'Uppgifter', role: ['chef', 'lärare', 'elev'] },
    { icon: 'quiz', label: 'Quiz', role: ['chef', 'lärare', 'elev'] },
    { icon: 'meddelanden', label: 'Meddelanden', role: ['chef', 'lärare', 'elev'] },
    { icon: 'kalender', label: 'Kalender', role: ['chef', 'lärare', 'elev'] },
    { icon: 'ai', label: 'AI-lärare', role: ['chef', 'lärare', 'elev'] },
    { icon: 'instellingar', label: 'Inställningar', role: ['chef', 'lärare', 'elev'] },
  ];

  const visibleItems = items.filter(item => item.role.includes(role));

  return visibleItems
    .map(item => `
      <li class="menu-item">
        <a href="#/app" data-view="${item.icon}">
          ${getSidebarIcon(item.icon)}
          <span>${item.label}</span>
        </a>
      </li>
    `)
    .join('');
}

function getSidebarIcon(type: string): string {
  const icons: Record<string, string> = {
    kurser: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    uppgifter: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    quiz: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    meddelanden: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    kalender: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    ai: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4c0 2-3 7-4 7s-4-5-4-7a4 4 0 0 1 4-4z"/><path d="M8 15v1a4 4 0 0 0 8 0v-1"/><circle cx="12" cy="9" r="1" fill="currentColor"/></svg>`,
    instellingar: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  };

  return icons[type] || '';
}

function renderChefPanel(): string {
  return `
    <div class="card chef-card">
      <h3>Chefpanel</h3>
      <p>Som chef har du fullständig behörighet över hela Studora.</p>
      <div class="chef-actions">
        <button class="action-btn" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Hantera användare
        </button>
        <button class="action-btn" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Hantera klasser
        </button>
        <button class="action-btn" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Systeminställningar
        </button>
      </div>
    </div>
  `;
}

function renderLararePanel(): string {
  return `
    <div class="card larare-card">
      <h3>Lärarpanel</h3>
      <p>Som lärare har du tillgång till dina klasser och elever.</p>
      <div class="chef-actions">
        <button class="action-btn" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Mina elever
        </button>
        <button class="action-btn" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Mina kurser
        </button>
      </div>
    </div>
  `;
}

function renderElevPanel(): string {
  return `
    <div class="card elev-card">
      <h3>Elevvy</h3>
      <p>Som elev har du tillgång till dina kurser, uppgifter och betyg.</p>
      <div class="chef-actions">
        <button class="action-btn" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Mina uppgifter
        </button>
        <button class="action-btn" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Mina betyg
        </button>
      </div>
    </div>
  `;
}

function setupSidebarNavigation(container: HTMLElement): void {
  container.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', (e: Event) => {
      e.preventDefault();

      container.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
      });

      (link.closest('.menu-item') as HTMLElement)?.classList.add('active');
    });
  });
}

export function renderResetPage(container: HTMLElement): void {
  container.innerHTML = `
    <div class="reset-container">
      <div class="reset-card">
        <h1>Välj nytt lösenord</h1>
        <p class="reset-sub">Du kom hit via återställningslänken.</p>

        <form id="reset-form">
          <div class="reset-field">
            <label for="new-password">Nytt lösenord</label>
            <input id="new-password" type="password" autocomplete="new-password" minlength="8" required />
          </div>

          <button id="save-btn" class="reset-btn" type="submit">Spara lösenord</button>

          <p id="reset-msg" class="reset-msg"></p>
        </form>

        <button id="back-btn" class="link-btn" type="button">Till inloggningen</button>
      </div>
    </div>
  `;

  const form = document.getElementById('reset-form') as HTMLFormElement;
  const msg = document.getElementById('reset-msg');
  const backBtn = document.getElementById('back-btn');

  form?.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    const password = (document.getElementById('new-password') as HTMLInputElement)?.value;

    if (!password) {
      if (msg) msg.textContent = 'Ange ett nytt lösenord.';
      return;
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      if (msg) msg.textContent = 'Fel: ' + error.message;
      return;
    }

    await signOut();
    if (msg) msg.textContent = 'Lösenordet är sparat. Logga in med det nya.';

    setTimeout(() => {
      window.location.hash = '#/login';
      window.location.reload();
    }, 1500);
  });

  backBtn?.addEventListener('click', () => {
    window.location.hash = '#/login';
    window.location.reload();
  });
}
