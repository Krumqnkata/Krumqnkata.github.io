// Window manager: minimise / close to the taskbar, maximise, drag (large screens).
const taskbar = () => document.querySelector<HTMLElement>('[data-taskbar]');

function addToTaskbar(win: HTMLElement) {
  const bar = taskbar();
  if (!bar || bar.querySelector(`[data-for="${CSS.escape(win.dataset.winId!)}"]`)) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'task';
  b.dataset.for = win.dataset.winId!;
  b.textContent = win.dataset.win || 'window';
  b.title = b.textContent;
  b.addEventListener('click', () => restore(win, true));
  bar.append(b);
  bar.hidden = false;
}

function removeFromTaskbar(win: HTMLElement) {
  const bar = taskbar();
  bar?.querySelector(`[data-for="${CSS.escape(win.dataset.winId!)}"]`)?.remove();
  if (bar && !bar.childElementCount) bar.hidden = true;
}

export function minimize(win: HTMLElement, closeIt = false) {
  if (win.classList.contains('win-max')) toggleMax(win);
  win.classList.add(closeIt ? 'win-closed' : 'win-min');
  addToTaskbar(win);
  if (closeIt) taskbar()?.querySelector<HTMLElement>(`[data-for="${CSS.escape(win.dataset.winId!)}"]`)?.focus();
}

export function restore(win: HTMLElement, focus = false) {
  win.classList.remove('win-min', 'win-closed');
  removeFromTaskbar(win);
  if (focus) {
    win.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    win.querySelector<HTMLElement>('[data-win-act="min"]')?.focus({ preventScroll: true });
  }
}

export function toggleMax(win: HTMLElement) {
  const max = !win.classList.contains('win-max');
  win.classList.toggle('win-max', max);
  document.documentElement.classList.toggle('has-max', !!document.querySelector('.win-max'));
  const btn = win.querySelector<HTMLButtonElement>('[data-win-act="max"]');
  if (btn) {
    btn.setAttribute('aria-pressed', String(max));
    const label = max ? btn.dataset.labelRestore : btn.dataset.labelMax;
    btn.title = label || '';
    btn.setAttribute('aria-label', `${label}: ${win.dataset.win}`);
    btn.textContent = max ? '❐' : '□';
  }
  if (max) {
    win.style.transform = '';
    win.querySelector<HTMLElement>('.win-body')?.scrollTo(0, 0);
  }
}

function enableDrag(win: HTMLElement, bar: HTMLElement) {
  let startX = 0, startY = 0, baseX = 0, baseY = 0, dragging = false;
  const large = () => window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches;
  bar.addEventListener('pointerdown', (e) => {
    if (!large() || (e.target as HTMLElement).closest('button') || win.classList.contains('win-max')) return;
    dragging = true;
    const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(win.style.transform);
    baseX = m ? +m[1] : 0;
    baseY = m ? +m[2] : 0;
    startX = e.clientX;
    startY = e.clientY;
    bar.setPointerCapture(e.pointerId);
    win.classList.add('win-dragging');
  });
  bar.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    win.style.transform = `translate(${baseX + e.clientX - startX}px, ${baseY + e.clientY - startY}px)`;
  });
  const end = () => {
    dragging = false;
    win.classList.remove('win-dragging');
  };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
}

export function initWindows() {
  let n = 0;
  document.querySelectorAll<HTMLElement>('.win[data-win]').forEach((win) => {
    win.dataset.winId = `w${n++}`;
    const bar = win.querySelector<HTMLElement>('[data-win-bar]');
    if (!bar) return;
    bar.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-win-act]')?.dataset.winAct;
      if (act === 'min') win.classList.contains('win-min') ? restore(win) : minimize(win);
      else if (act === 'close') minimize(win, true);
      else if (act === 'max') toggleMax(win);
      else if (win.classList.contains('win-min')) restore(win);
    });
    bar.addEventListener('dblclick', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      if (win.hasAttribute('data-drag') && win.style.transform) win.style.transform = '';
      else toggleMax(win);
    });
    if (win.hasAttribute('data-drag')) enableDrag(win, bar);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const max = document.querySelector<HTMLElement>('.win-max');
    if (max && !document.querySelector('dialog[open]')) toggleMax(max);
  });
  window.addEventListener('krumos:minimize', (e) => minimize((e as CustomEvent<HTMLElement>).detail));
}
