// Game mode: a tiny bus drives across the page, using headings, cards and buttons
// as platforms, and catches the bugs hiding between the projects.
// Everything lives in document coordinates; the canvas is a fixed overlay.

import { busy, unlock } from './os.ts';

type Platform = { x1: number; x2: number; y: number };
type Bug = { x: number; y: number; phase: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const PLATFORM_SELECTOR = [
  'h1', 'h2', '.btn', '.chip-accent', '.win', '.tile', '.panel', '.fp-thumbs', '.client-desktop',
  '.filters button', '.search', '.callout', '.gallery button', '.markdown', '.statusline',
].join(',');

const GRAVITY = 2300;
const SPEED = 320;
const JUMP = 860;
const BUS_W = 38;
const BUS_H = 24;
const BUG_COUNT = 5;
const GOAL = 10;
const HEADER = 48;

const root = document.querySelector<HTMLElement>('[data-game]');
if (root) setup(root);

function setup(root: HTMLElement) {
  const toggle = root.querySelector<HTMLButtonElement>('[data-game-toggle]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-game-score]')!;
  const help = document.querySelector<HTMLElement>('[data-game-help]')!;
  const pad = document.querySelector<HTMLElement>('[data-game-pad]')!;
  const t = {
    on: root.dataset.on!,
    off: root.dataset.off!,
    win: root.dataset.win!,
  };

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let running = false;
  let raf = 0;
  let last = 0;
  let platforms: Platform[] = [];
  let platformsAt = 0;
  let colors = { accent: '#63e6dc', text: '#eef4fc', gold: '#edc789', muted: '#8fa7c4', bg: '#0a1424' };
  let score = 0;
  const keys = new Set<string>();
  const bugs: Bug[] = [];
  const sparks: Spark[] = [];
  const bus = { x: 0, y: 0, vx: 0, vy: 0, ground: false, facing: 1, jumps: 0, squash: 0, wheel: 0, dropUntil: 0 };

  const viewTop = () => window.scrollY;
  const viewBottom = () => window.scrollY + window.innerHeight;

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
    colors = { accent: v('--accent', colors.accent), text: v('--text', colors.text), gold: v('--gold', colors.gold), muted: v('--muted', colors.muted), bg: v('--bg', colors.bg) };
  }

  function collectPlatforms() {
    const list: Platform[] = [];
    const top = viewTop();
    for (const el of document.querySelectorAll<HTMLElement>(PLATFORM_SELECTOR)) {
      if (el.closest('.topbar, [data-game], [data-game-pad]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 8) continue;
      if (r.bottom < -400 || r.top > window.innerHeight + 400) continue;
      list.push({ x1: r.left, x2: r.right, y: r.top + top });
    }
    platforms = list;
  }

  function visiblePlatforms() {
    const top = viewTop() + HEADER + 70;
    const bottom = viewBottom() - 20;
    return platforms.filter((p) => p.y > top && p.y < bottom && p.x2 - p.x1 > 60);
  }

  function placeBug(bug: Bug) {
    const options = visiblePlatforms();
    if (options.length) {
      const p = options[Math.floor(Math.random() * options.length)];
      bug.x = p.x1 + 20 + Math.random() * (p.x2 - p.x1 - 40);
      bug.y = p.y - 26 - Math.random() * 50;
    } else {
      bug.x = 40 + Math.random() * (window.innerWidth - 80);
      bug.y = viewTop() + HEADER + 60 + Math.random() * (window.innerHeight - HEADER - 140);
    }
    bug.phase = Math.random() * Math.PI * 2;
  }

  function resize() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    platformsAt = 0;
  }

  function burst(x: number, y: number, color: string, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 220;
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.5 + Math.random() * 0.4, color });
    }
  }

  function toast(text: string) {
    const el = document.createElement('div');
    el.className = 'game-toast';
    el.setAttribute('role', 'status');
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function jump() {
    if (bus.ground || bus.jumps < 2) {
      bus.vy = -JUMP * (bus.ground ? 1 : 0.85);
      bus.jumps = bus.ground ? 1 : 2;
      bus.ground = false;
      burst(bus.x - bus.facing * 16, bus.y - 4, colors.muted, 6);
    }
  }

  function step(dt: number, now: number) {
    if (now - platformsAt > 350) {
      collectPlatforms();
      readColors();
      platformsAt = now;
    }

    // Horizontal movement with a little inertia.
    const dir = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const target = dir * SPEED;
    bus.vx += (target - bus.vx) * Math.min(1, dt * (bus.ground ? 12 : 6));
    if (dir) bus.facing = dir;
    bus.x += bus.vx * dt;
    bus.x = Math.max(BUS_W / 2, Math.min(window.innerWidth - BUS_W / 2, bus.x));
    bus.wheel += (bus.vx * dt) / 6;

    // Vertical movement with one-way platforms.
    const prevY = bus.y;
    bus.vy = Math.min(bus.vy + GRAVITY * dt, 1400);
    bus.y += bus.vy * dt;
    const wasGround = bus.ground;
    bus.ground = false;
    if (bus.vy >= 0 && now > bus.dropUntil) {
      for (const p of platforms) {
        if (bus.x + BUS_W * 0.3 < p.x1 || bus.x - BUS_W * 0.3 > p.x2) continue;
        if (prevY <= p.y + 1 && bus.y >= p.y) {
          bus.y = p.y;
          bus.vy = 0;
          bus.ground = true;
          break;
        }
      }
    }
    const floor = viewBottom() - 6;
    if (bus.y >= floor) {
      bus.y = floor;
      bus.vy = 0;
      bus.ground = true;
    }
    const ceiling = viewTop() + HEADER + BUS_H + 4;
    if (bus.y < ceiling) {
      bus.y = ceiling;
      if (bus.vy < 0) bus.vy = 0;
    }
    if (bus.ground) {
      if (!wasGround) bus.squash = 1;
      bus.jumps = 0;
    }
    bus.squash = Math.max(0, bus.squash - dt * 5);

    // Exhaust while driving.
    if (bus.ground && Math.abs(bus.vx) > 120 && Math.random() < dt * 18) {
      sparks.push({ x: bus.x - bus.facing * (BUS_W / 2 + 2), y: bus.y - 6, vx: -bus.facing * 40, vy: -30 - Math.random() * 30, life: 0.45, color: colors.muted });
    }

    // Bugs: keep them on screen, catch them when close.
    while (bugs.length < BUG_COUNT) {
      const bug = { x: 0, y: 0, phase: 0 };
      placeBug(bug);
      bugs.push(bug);
    }
    for (const bug of bugs) {
      bug.phase += dt * 4;
      if (bug.y < viewTop() + HEADER + 10 || bug.y > viewBottom() - 10) placeBug(bug);
      const dx = bug.x - bus.x;
      const dy = bug.y + Math.sin(bug.phase) * 4 - (bus.y - BUS_H / 2);
      if (dx * dx + dy * dy < 30 * 30) {
        burst(bug.x, bug.y, colors.accent);
        score++;
        scoreEl.textContent = `🐞 ${score}`;
        if (score % GOAL === 0) {
          unlock('bugs');
          toast(t.win);
          burst(bus.x, bus.y - 20, colors.gold, 40);
        }
        placeBug(bug);
      }
    }

    for (const s of sparks) {
      s.life -= dt;
      s.vy += 600 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
  }

  function drawBug(c: CanvasRenderingContext2D, x: number, y: number, phase: number) {
    const bob = Math.sin(phase) * 4;
    c.save();
    c.translate(x, y + bob);
    c.strokeStyle = colors.text;
    c.lineWidth = 1.5;
    const leg = Math.sin(phase * 3) * 2;
    for (const side of [-1, 1]) {
      for (const k of [-5, 0, 5]) {
        c.beginPath();
        c.moveTo(side * 5, k);
        c.lineTo(side * 11, k + (k === 0 ? leg : -leg) + 2);
        c.stroke();
      }
    }
    c.beginPath();
    c.moveTo(-3, -8); c.lineTo(-6, -14);
    c.moveTo(3, -8); c.lineTo(6, -14);
    c.stroke();
    c.fillStyle = '#ef6b7b';
    c.beginPath();
    c.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = colors.bg;
    c.fillRect(-0.75, -8, 1.5, 17);
    c.beginPath();
    c.arc(-3, -2, 1.6, 0, Math.PI * 2); c.arc(3, 3, 1.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = colors.text;
    c.beginPath();
    c.arc(0, -9, 3.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawBus(c: CanvasRenderingContext2D) {
    const sx = 1 + bus.squash * 0.18;
    const sy = 1 - bus.squash * 0.18;
    c.save();
    c.translate(bus.x, bus.y);
    c.scale(bus.facing * sx, sy);
    const w = BUS_W;
    const h = BUS_H;
    // body
    c.fillStyle = colors.accent;
    c.beginPath();
    c.roundRect(-w / 2, -h - 2, w, h - 4, [7, 9, 4, 4]);
    c.fill();
    // windows
    c.fillStyle = colors.bg;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.roundRect(-w / 2 + 4 + i * 9, -h + 2, 7, 7, 2);
      c.fill();
    }
    c.beginPath();
    c.roundRect(w / 2 - 8, -h + 2, 5, 9, [2, 4, 2, 2]);
    c.fill();
    // headlight and route number
    c.fillStyle = colors.gold;
    c.fillRect(w / 2 - 3, -9, 3, 3);
    c.fillStyle = colors.bg;
    c.font = '700 6px ui-monospace, monospace';
    c.fillText('33', -w / 2 + 4, -8);
    // wheels
    for (const wx of [-w / 2 + 9, w / 2 - 9]) {
      c.fillStyle = colors.text;
      c.beginPath();
      c.arc(wx, -4, 5, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = colors.bg;
      c.lineWidth = 1.5;
      c.beginPath();
      const a = bus.wheel * bus.facing;
      c.moveTo(wx + Math.cos(a) * 3.5, -4 + Math.sin(a) * 3.5);
      c.lineTo(wx - Math.cos(a) * 3.5, -4 - Math.sin(a) * 3.5);
      c.stroke();
    }
    c.restore();
  }

  function draw() {
    if (!ctx) return;
    const c = ctx;
    const top = viewTop();
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    c.save();
    c.translate(0, -top);
    for (const bug of bugs) drawBug(c, bug.x, bug.y, bug.phase);
    for (const s of sparks) {
      c.globalAlpha = Math.max(0, Math.min(1, s.life * 2));
      c.fillStyle = s.color;
      c.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
    }
    c.globalAlpha = 1;
    drawBus(c);
    c.restore();
  }

  function loop(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;
    step(dt, now);
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  const keyMap: Record<string, string> = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ArrowDown: 'down', KeyS: 'down',
  };

  function isTyping(e: Event) {
    const el = e.target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') return stop();
    const action = keyMap[e.code];
    if (!action || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (action === 'jump') {
      if (!e.repeat) jump();
    } else if (action === 'down') {
      bus.dropUntil = performance.now() + 220;
    } else {
      keys.add(action);
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    const action = keyMap[e.code];
    if (action) keys.delete(action);
  }

  function bindPad() {
    for (const btn of pad.querySelectorAll<HTMLButtonElement>('[data-pad]')) {
      const action = btn.dataset.pad!;
      const press = (e: Event) => {
        e.preventDefault();
        if (action === 'jump') jump();
        else keys.add(action);
      };
      const release = () => keys.delete(action);
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('pointercancel', release);
    }
  }
  bindPad();

  function start() {
    if (running) return;
    running = true;
    busy.game = true;
    canvas = document.createElement('canvas');
    canvas.className = 'game-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    readColors();
    collectPlatforms();
    bus.x = Math.min(120, window.innerWidth / 2);
    bus.y = viewTop() + HEADER + 60;
    bus.vx = 0;
    bus.vy = 0;
    bugs.length = 0;
    sparks.length = 0;
    toggle.setAttribute('aria-pressed', 'true');
    toggle.setAttribute('aria-label', t.off);
    help.hidden = false;
    setTimeout(() => (help.hidden = true), 6000);
    scoreEl.hidden = false;
    scoreEl.textContent = `🐞 ${score}`;
    if (window.matchMedia('(pointer: coarse)').matches) pad.hidden = false;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', resize);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (!running) return;
    running = false;
    busy.game = false;
    cancelAnimationFrame(raf);
    canvas?.remove();
    canvas = null;
    ctx = null;
    keys.clear();
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', t.on);
    help.hidden = true;
    pad.hidden = true;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', resize);
  }

  toggle.addEventListener('click', () => (running ? stop() : start()));
}
