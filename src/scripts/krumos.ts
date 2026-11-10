// KrumOS entry: wires every interactive piece. Heavy parts load on demand.
import './game.ts';
import { data, renderTrophy, unlock, reducedMotion } from './os.ts';
import { initWindows } from './windows.ts';
import { boot } from './boot.ts';

const idle = (fn: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 600));

boot();
initWindows();
renderTrophy();

// ---- Command palette: Ctrl/Cmd+K, "/" or the top-bar button ----
const openPalette = async () => (await import('./palette.ts')).openPalette();
document.querySelector('[data-palette-open]')?.addEventListener('click', openPalette);
window.addEventListener('keydown', (e) => {
  const el = e.target as HTMLElement;
  const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openPalette();
  } else if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) {
    e.preventDefault();
    openPalette();
  }
});

// ---- Terminal in the hero ----
const tty = document.querySelector<HTMLElement>('[data-terminal]');
if (tty) import('./terminal.ts').then(({ initTerminal }) => initTerminal(tty));

// ---- Snake on the contribution calendar ----
const snakeBtn = document.querySelector<HTMLButtonElement>('[data-snake-play]');
if (snakeBtn) {
  snakeBtn.hidden = false;
  snakeBtn.addEventListener('click', async () => {
    const svg = document.querySelector<SVGSVGElement>('svg.cal');
    const status = document.querySelector<HTMLElement>('[data-snake-status]');
    if (!svg || !status) return;
    (await import('./snake.ts')).toggleSnake(svg, snakeBtn, status);
  });
  // Arriving from the terminal or palette with ?play=snake starts the game.
  if (new URLSearchParams(location.search).get('play') === 'snake') {
    snakeBtn.scrollIntoView({ block: 'center' });
    setTimeout(() => snakeBtn.click(), 400);
  }
}

// ---- Secrets: Konami code, logo clicks, 404 ----
const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let pos = 0;
window.addEventListener('keydown', (e) => {
  pos = e.key.toLowerCase() === konami[pos].toLowerCase() ? pos + 1 : e.key === konami[0] ? 1 : 0;
  if (pos === konami.length) {
    pos = 0;
    document.documentElement.classList.add('konami');
    setTimeout(() => document.documentElement.classList.remove('konami'), 2400);
    unlock('konami');
  }
});
let clicks = 0;
let clickTimer = 0;
document.querySelector('.os-logo')?.addEventListener('click', (e) => {
  clicks++;
  window.clearTimeout(clickTimer);
  clickTimer = window.setTimeout(() => (clicks = 0), 1500);
  if (clicks >= 5) {
    e.preventDefault();
    clicks = 0;
    unlock('logo');
  } else if (location.pathname === new URL((e.currentTarget as HTMLAnchorElement).href).pathname) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }
});
if (document.body.dataset.page === '404') setTimeout(() => unlock('lost'), 800);
document.querySelector('[data-trophy]')?.addEventListener('click', async () => {
  (await import('./palette.ts')).openPalette();
});

// ---- Relative times ("3h ago") for the git log ----
const rtf = new Intl.RelativeTimeFormat(data().lang === 'bg' ? 'bg' : 'en', { numeric: 'auto' });
document.querySelectorAll<HTMLTimeElement>('time[data-rel]').forEach((t) => {
  const diff = (Date.parse(t.dateTime) - Date.now()) / 1000;
  const abs = Math.abs(diff);
  t.textContent =
    abs < 3600 ? rtf.format(Math.round(diff / 60), 'minute') : abs < 86400 ? rtf.format(Math.round(diff / 3600), 'hour') : rtf.format(Math.round(diff / 86400), 'day');
});

// ---- Later: screensaver and new-project notification ----
idle(async () => {
  (await import('./screensaver.ts')).watchIdle();
  setTimeout(async () => (await import('./notify.ts')).notifyNewProjects(), 2500);
});
