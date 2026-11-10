// Boot screen: systemd-style start-up shown once per visitor (or on `reboot`).
import { data, store, reducedMotion, unlock } from './os.ts';

export function boot(force = false) {
  if (!force && (store.get('booted', false) || reducedMotion())) return;
  store.set('booted', true);
  if (force) unlock('reboot');
  const d = data();
  const lines: [string, string][] = [
    ['', `KrumOS 26.11 tty1 — ${d.lang === 'bg' ? 'Стара Загора' : 'Stara Zagora'}`],
    ['', ''],
    ['ok', 'Started Fira Code console font.'],
    ['ok', 'Mounted /home/krum.'],
    ['ok', `Mounted /home/krum/projects (${d.totals.projects}).`],
    ['ok', `Started ${d.totals.live} live demos.`],
    ['ok', 'Reached target Network (github.com).'],
    ['ok', 'Started bus 33 service.'],
    ['ok', 'Reached target Portfolio.'],
    ['', ''],
    ['', 'krum@stara-zagora login: guest'],
  ];
  const screen = document.createElement('div');
  screen.className = 'boot';
  screen.setAttribute('role', 'status');
  screen.setAttribute('aria-label', 'KrumOS boot');
  const pre = document.createElement('div');
  pre.className = 'boot-log';
  const hint = document.createElement('p');
  hint.className = 'boot-hint';
  hint.textContent = d.s.boot.skip;
  screen.append(pre, hint);
  document.body.append(screen);
  document.documentElement.classList.add('booting');

  let i = 0;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.clearInterval(timer);
    screen.classList.add('boot-out');
    document.documentElement.classList.remove('booting');
    setTimeout(() => screen.remove(), 350);
    window.removeEventListener('keydown', finish);
    screen.removeEventListener('pointerdown', finish);
  };
  const timer = window.setInterval(() => {
    if (i >= lines.length) {
      window.clearInterval(timer);
      setTimeout(finish, 450);
      return;
    }
    const [kind, text] = lines[i++];
    const row = document.createElement('div');
    if (kind === 'ok') {
      const tag = document.createElement('span');
      tag.className = 'boot-ok';
      tag.textContent = '[  OK  ] ';
      row.append(tag);
    }
    row.append(document.createTextNode(text || ' '));
    pre.append(row);
  }, 120);
  window.addEventListener('keydown', finish);
  screen.addEventListener('pointerdown', finish);
}
