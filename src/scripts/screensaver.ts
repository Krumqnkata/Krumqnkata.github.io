// xscreensaver-style idle screen: bus 33 drives along Stara Zagora's lines, with a big clock.
import { data, busy, reducedMotion, unlock } from './os.ts';

let active: (() => void) | null = null;

export function startScreensaver() {
  if (active) return;
  const d = data();
  const canvas = document.createElement('canvas');
  canvas.className = 'saver';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d')!;
  let w = 0, h = 0, raf = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  // Three bus lines as smooth curves across the screen.
  const lines = [
    { color: '#dda15e', pts: (t: number) => ({ x: t * w, y: h * (0.62 + 0.18 * Math.sin(t * 5.2)) }) },
    { color: '#bc6c25', pts: (t: number) => ({ x: t * w, y: h * (0.3 + 0.16 * Math.sin(t * 3.4 + 1.5)) }) },
    { color: '#606c38', pts: (t: number) => ({ x: w * (0.3 + 0.22 * Math.sin(t * 4 + 0.6)), y: t * h }) },
  ];
  const buses = lines.map((_, i) => ({ line: i, t: Math.random(), speed: 0.035 + i * 0.012 }));
  const fmt = new Intl.DateTimeFormat(d.lang === 'bg' ? 'bg-BG' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Sofia' });
  let last = performance.now();

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.fillStyle = '#121909';
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (const l of lines) {
      ctx.strokeStyle = l.color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (let t = 0; t <= 1.001; t += 0.01) {
        const p = l.pts(t);
        t === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let t = 0.08; t < 1; t += 0.16) {
        const p = l.pts(t);
        ctx.fillStyle = '#fefae0';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#283618';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    for (const b of buses) {
      b.t = (b.t + b.speed * dt) % 1;
      const l = lines[b.line];
      const p = l.pts(b.t);
      const q = l.pts(Math.min(1, b.t + 0.005));
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#dda15e';
      ctx.beginPath();
      ctx.roundRect(-22, -12, 44, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#1a2310';
      for (let i = 0; i < 3; i++) ctx.fillRect(-17 + i * 11, -8, 8, 7);
      ctx.fillStyle = '#fefae0';
      ctx.fillRect(18, -3, 3, 4);
      ctx.restore();
    }
    ctx.fillStyle = '#fefae0';
    ctx.textAlign = 'center';
    ctx.font = `${Math.min(120, w / 6)}px 'Press Start 2P', monospace`;
    ctx.fillText(fmt.format(new Date()), w / 2, h * 0.5);
    ctx.font = `16px 'Fira Code', monospace`;
    ctx.fillStyle = '#c3bf98';
    ctx.fillText('krum@stara-zagora — KrumOS 26.11', w / 2, h * 0.5 + 50);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  unlock('screensaver');

  const stop = () => {
    cancelAnimationFrame(raf);
    canvas.remove();
    window.removeEventListener('resize', resize);
    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => window.removeEventListener(ev, wake));
    active = null;
  };
  // Ignore the tiny mouse jitter right after starting.
  const started = performance.now();
  const wake = () => {
    if (performance.now() - started > 600) stop();
  };
  window.addEventListener('resize', resize);
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
  active = stop;
}

/** Start the screensaver after `seconds` without input (60 s, or ?idle=N for testing). */
export function watchIdle() {
  if (reducedMotion()) return;
  const param = Number(new URLSearchParams(location.search).get('idle'));
  const seconds = param > 0 ? param : 60;
  let timer = 0;
  const reset = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (busy.game || busy.snake || document.querySelector('dialog[open]') || document.hidden) return reset();
      startScreensaver();
    }, seconds * 1000);
  };
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((ev) => window.addEventListener(ev, () => !active && reset(), { passive: true }));
  reset();
}
