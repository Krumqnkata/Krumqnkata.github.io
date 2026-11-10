// Command palette (Ctrl+K or /): jump to any section, project, page or action.
// ARIA combobox + listbox inside a modal <dialog>.
import { data, go, toggleTheme, found, SECRETS } from './os.ts';

type Item = { group: string; label: string; detail?: string; keywords: string; run: () => void };

let dialog: HTMLDialogElement | null = null;
let opener: Element | null = null;

function items(): Item[] {
  const d = data();
  const s = d.s.palette;
  const g = s.groups;
  const a = s.actions;
  const list: Item[] = [];
  d.sections.forEach((sec, i) => {
    const page = d.s.pages[sec.id as 'uses'];
    list.push({ group: g.pages, label: `${i + 1} · ${sec.label}`, detail: page?.cmd ?? sec.path, keywords: `${sec.id} ${page?.title ?? ''}`, run: () => go(sec.path) });
  });
  for (const p of d.projects) {
    list.push({ group: g.projects, label: p.title, detail: [p.cat, p.lang].filter(Boolean).join(' · '), keywords: `${p.name} ${p.slug} ${p.stack.join(' ')}`, run: () => go(p.page) });
  }
  const click = (sel: string) => () => document.querySelector<HTMLElement>(sel)?.click();
  list.push(
    { group: g.actions, label: a.theme, keywords: 'theme dark light тема', run: toggleTheme },
    { group: g.actions, label: a.lang, keywords: 'language lang bg en език', run: () => (location.href = d.altPath) },
    { group: g.actions, label: a.terminal, keywords: 'terminal shell bash терминал', run: () => {
      const input = document.querySelector<HTMLInputElement>('[data-tty-in]');
      if (input) { input.scrollIntoView({ block: 'center' }); input.focus(); } else go(d.home);
    } },
    { group: g.actions, label: a.game, keywords: 'game bus play игра автобус', run: click('[data-game-toggle]') },
    { group: g.actions, label: a.snake, keywords: 'snake game змия игра', run: () => {
      const btn = document.querySelector<HTMLElement>('[data-snake-play]');
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } else go(`${d.sections.find((x) => x.id === 'activity')!.path}?play=snake`);
    } },
    { group: g.actions, label: a.screensaver, keywords: 'screensaver idle скрийнсейвър', run: async () => (await import('./screensaver.ts')).startScreensaver() },
    { group: g.actions, label: a.reboot, keywords: 'reboot restart boot рестарт', run: async () => (await import('./boot.ts')).boot(true) },
    { group: g.actions, label: a.badges, keywords: 'github achievements badges постижения значки', run: () => go(`${d.sections.find((x) => x.id === 'activity')!.path}#gh-badges`) },
    { group: g.actions, label: a.github, keywords: 'github code', run: () => window.open(`https://github.com/${d.owner}`, '_blank', 'noopener') },
    { group: g.actions, label: a.email, keywords: 'email mail contact имейл', run: () => (location.href = `mailto:${d.email}`) },
  );
  const got = found();
  for (const id of SECRETS) {
    const it = d.s.secrets.items[id];
    if (got.includes(id)) list.push({ group: g.secrets, label: `🏆 ${it.title}`, detail: it.hint, keywords: 'achievement secret тайна', run: () => {} });
  }
  return list;
}

/** Simple fuzzy score: all query characters in order; bonus for word starts and contiguous runs. */
function score(text: string, q: string) {
  if (!q) return 1;
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 - t.indexOf(q);
  let ti = 0;
  let sc = 0;
  for (const ch of q) {
    const i = t.indexOf(ch, ti);
    if (i < 0) return 0;
    sc += i === ti ? 3 : 1;
    if (i === 0 || t[i - 1] === ' ' || t[i - 1] === '-') sc += 2;
    ti = i + 1;
  }
  return sc;
}

function build() {
  const d = data();
  const s = d.s.palette;
  dialog = document.createElement('dialog');
  dialog.className = 'palette';
  dialog.setAttribute('aria-label', s.label);
  dialog.innerHTML = `
    <div class="palette-box">
      <div class="palette-input"><span aria-hidden="true">❯</span>
        <input type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" />
      </div>
      <ul id="palette-list" role="listbox"></ul>
      <p class="palette-hint"></p>
    </div>`;
  document.body.append(dialog);
  const input = dialog.querySelector('input')!;
  const ul = dialog.querySelector('ul')!;
  input.placeholder = s.placeholder;
  input.setAttribute('aria-label', s.label);
  dialog.querySelector('.palette-hint')!.textContent = s.hint;

  let all: Item[] = [];
  let shown: Item[] = [];
  let active = 0;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    shown = all
      .map((it) => ({ it, sc: Math.max(score(it.label, q) * 2, score(`${it.keywords} ${it.detail ?? ''}`, q)) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => (q ? b.sc - a.sc : 0))
      .slice(0, 40)
      .map((x) => x.it);
    active = Math.min(active, Math.max(0, shown.length - 1));
    ul.textContent = '';
    let lastGroup = '';
    shown.forEach((it, i) => {
      if (it.group !== lastGroup && !q) {
        const h = document.createElement('li');
        h.className = 'palette-group';
        h.setAttribute('role', 'presentation');
        h.textContent = it.group;
        ul.append(h);
        lastGroup = it.group;
      }
      const li = document.createElement('li');
      li.id = `pal-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      const label = document.createElement('span');
      label.textContent = it.label;
      li.append(label);
      if (it.detail) {
        const det = document.createElement('small');
        det.textContent = q ? `${it.group} · ${it.detail}` : it.detail;
        li.append(det);
      }
      li.addEventListener('mousemove', () => {
        if (active !== i) { active = i; mark(); }
      });
      li.addEventListener('click', () => choose(i));
      ul.append(li);
    });
    if (!shown.length) {
      const li = document.createElement('li');
      li.className = 'palette-empty';
      li.textContent = s.empty;
      ul.append(li);
    }
    mark();
  };
  const mark = () => {
    ul.querySelectorAll('[role=option]').forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    const cur = ul.querySelector(`#pal-${active}`);
    if (cur) {
      input.setAttribute('aria-activedescendant', cur.id);
      cur.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  };
  const choose = (i: number) => {
    const it = shown[i];
    if (!it) return;
    close();
    it.run();
  };
  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { active = Math.min(shown.length - 1, active + 1); mark(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); mark(); e.preventDefault(); }
    else if (e.key === 'Enter') { choose(active); e.preventDefault(); }
    else if (e.key === 'Escape') { close(); e.preventDefault(); }
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('close', () => { if (opener instanceof HTMLElement) opener.focus({ preventScroll: true }); });

  return {
    open() {
      all = items();
      input.value = '';
      active = 0;
      render();
      dialog!.showModal();
      input.focus();
    },
  };
}

let api: ReturnType<typeof build> | null = null;
function close() { dialog?.close(); }

export function openPalette() {
  opener = document.activeElement;
  api ??= build();
  api.open();
}
