// Shared helpers for the KrumOS scripts: page data, storage, toasts, achievements.
import type { OsData } from '../lib/osdata.ts';

let cached: OsData | null = null;
export function data(): OsData {
  if (!cached) {
    const el = document.getElementById('krumos-data');
    cached = JSON.parse(el?.textContent || '{}') as OsData;
  }
  return cached;
}

export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`krumos:${key}`);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`krumos:${key}`, JSON.stringify(value));
    } catch {
      /* private mode: ignore */
    }
  },
};

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Short notice at the top of the screen. */
export function toast(text: string, ms = 2800) {
  const el = document.createElement('div');
  el.className = 'game-toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

export function setTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  store.set('theme', theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('krumos:theme', { detail: theme }));
}
export const toggleTheme = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

/** Go to a path; same-page anchors scroll smoothly. */
export function go(path: string) {
  const url = new URL(path, location.href);
  if (url.pathname === location.pathname && url.hash) {
    document.querySelector(url.hash)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
    history.replaceState(null, '', url.hash);
  } else {
    location.href = url.href;
  }
}

/** Busy = a game is running; screensaver and notifications stay quiet. */
export const busy = { game: false, snake: false };

// ---------- Achievements ----------
export const SECRETS = ['konami', 'sudo', 'rm', 'logo', 'bugs', 'snake', 'screensaver', 'reboot', 'lost'] as const;
export type SecretId = (typeof SECRETS)[number];

export function found(): SecretId[] {
  return store.get<SecretId[]>('secrets', []).filter((id) => (SECRETS as readonly string[]).includes(id));
}

export function renderTrophy() {
  const chip = document.querySelector<HTMLElement>('[data-trophy]');
  if (!chip) return;
  const n = found().length;
  chip.hidden = n === 0;
  const count = chip.querySelector('[data-trophy-count]');
  if (count) count.textContent = `${n}/${SECRETS.length}`;
}

export function unlock(id: SecretId) {
  const list = found();
  if (list.includes(id)) return;
  list.push(id);
  store.set('secrets', list);
  renderTrophy();
  const s = data().s.secrets;
  toast(`🏆 ${s.unlocked}: ${s.items[id]?.title ?? id} (${list.length}/${SECRETS.length})`, 3600);
}
