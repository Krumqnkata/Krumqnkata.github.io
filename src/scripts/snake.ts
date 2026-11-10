// Snake played directly on the contribution calendar SVG: eat the days with commits.
import { data, store, busy, unlock, reducedMotion } from './os.ts';

const NS = 'http://www.w3.org/2000/svg';
const CELL = 11;
const STEP = 14;
const TOP = 16;

type P = { x: number; y: number };

let running: { stop: () => void } | null = null;

export function toggleSnake(svg: SVGSVGElement, btn: HTMLButtonElement, status: HTMLElement) {
  if (running) {
    running.stop();
    return;
  }
  running = play(svg, btn, status);
}

function play(svg: SVGSVGElement, btn: HTMLButtonElement, status: HTMLElement) {
  const s = data().s.snake;
  const rects = Array.from(svg.querySelectorAll<SVGRectElement>('rect[class^="l"]'));
  const cols = Math.round((svg.viewBox.baseVal.width + (STEP - CELL)) / STEP);
  const rows = 7;
  const grid = new Map<string, { rect: SVGRectElement; cls: string; count: number }>();
  for (const r of rects) {
    const x = Math.round(+r.getAttribute('x')! / STEP);
    const y = Math.round((+r.getAttribute('y')! - TOP) / STEP);
    const count = Number(r.querySelector('title')?.textContent?.split(':').pop() || 0);
    grid.set(`${x},${y}`, { rect: r, cls: r.getAttribute('class')!, count });
  }
  const wrap = svg.closest<HTMLElement>('.cal-wrap');
  const layer = document.createElementNS(NS, 'g');
  layer.setAttribute('class', 'snake-layer');
  svg.append(layer);
  svg.classList.add('snake-on');

  let snake: P[] = [{ x: 2, y: 3 }, { x: 1, y: 3 }, { x: 0, y: 3 }];
  let dir: P = { x: 1, y: 0 };
  let queued: P[] = [];
  let score = 0;
  let commits = 0;
  let over = false;
  let best = store.get('snake-best', 0);
  const eaten = new Set<string>();
  busy.snake = true;
  btn.textContent = `■ ${s.stop}`;
  btn.setAttribute('aria-pressed', 'true');

  const say = (extra = '') => {
    status.textContent = `${s.score}: ${score} · commits: ${commits} · ${s.best}: ${best}${extra ? ` — ${extra}` : ''}`;
  };
  say(s.help);

  const draw = () => {
    layer.textContent = '';
    snake.forEach((p, i) => {
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', String(p.x * STEP - 1));
      r.setAttribute('y', String(TOP + p.y * STEP - 1));
      r.setAttribute('width', String(CELL + 2));
      r.setAttribute('height', String(CELL + 2));
      r.setAttribute('rx', i === 0 ? '4' : '2');
      r.setAttribute('class', i === 0 ? 'snake-head' : 'snake-body');
      layer.append(r);
    });
    if (wrap) {
      const head = snake[0].x * STEP * (wrap.scrollWidth / svg.viewBox.baseVal.width);
      if (head < wrap.scrollLeft + 40 || head > wrap.scrollLeft + wrap.clientWidth - 40) wrap.scrollLeft = head - wrap.clientWidth / 2;
    }
  };

  const tick = () => {
    if (over) return;
    const next = queued.shift();
    if (next && !(next.x === -dir.x && next.y === -dir.y)) dir = next;
    const head = { x: (snake[0].x + dir.x + cols) % cols, y: (snake[0].y + dir.y + rows) % rows };
    if (snake.some((p) => p.x === head.x && p.y === head.y)) {
      over = true;
      best = Math.max(best, score);
      store.set('snake-best', best);
      say(s.over);
      return;
    }
    snake.unshift(head);
    const key = `${head.x},${head.y}`;
    const cell = grid.get(key);
    if (cell && cell.count > 0 && !eaten.has(key)) {
      eaten.add(key);
      cell.rect.setAttribute('class', 'l0');
      score++;
      commits += cell.count;
      if (score >= 20) unlock('snake');
      say();
    } else snake.pop();
    draw();
  };

  const timer = window.setInterval(tick, reducedMotion() ? 220 : 130);
  const dirs: Record<string, P> = {
    ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 },
  };
  const restart = () => {
    snake = [{ x: 2, y: 3 }, { x: 1, y: 3 }, { x: 0, y: 3 }];
    dir = { x: 1, y: 0 };
    queued = [];
    score = 0;
    commits = 0;
    over = false;
    for (const k of eaten) {
      const c = grid.get(k)!;
      c.rect.setAttribute('class', c.cls);
    }
    eaten.clear();
    say(s.help);
  };
  const onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
    if (e.key === 'Escape') return stop();
    if (e.code === 'Space' && over) {
      e.preventDefault();
      return restart();
    }
    const d = dirs[e.code];
    if (d) {
      e.preventDefault();
      if (queued.length < 3) queued.push(d);
    }
  };
  let sx = 0, sy = 0;
  const down = (e: PointerEvent) => { sx = e.clientX; sy = e.clientY; };
  const up = (e: PointerEvent) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (over) return restart();
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    queued.push(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
  };
  window.addEventListener('keydown', onKey);
  wrap?.addEventListener('pointerdown', down);
  wrap?.addEventListener('pointerup', up);
  if (wrap) wrap.style.touchAction = 'none';
  draw();

  function stop() {
    window.clearInterval(timer);
    window.removeEventListener('keydown', onKey);
    wrap?.removeEventListener('pointerdown', down);
    wrap?.removeEventListener('pointerup', up);
    if (wrap) wrap.style.touchAction = '';
    for (const k of eaten) {
      const c = grid.get(k)!;
      c.rect.setAttribute('class', c.cls);
    }
    layer.remove();
    svg.classList.remove('snake-on');
    best = Math.max(best, score);
    store.set('snake-best', best);
    busy.snake = false;
    btn.textContent = `▶ ${s.play}`;
    btn.setAttribute('aria-pressed', 'false');
    status.textContent = `${s.best}: ${best}`;
    running = null;
  }
  return { stop };
}
