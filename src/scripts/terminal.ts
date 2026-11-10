// A small but real shell in the hero window. Output is built with DOM nodes
// (textContent only), so nothing typed by a visitor is ever parsed as HTML.
import { data, store, go, setTheme, unlock, found, SECRETS } from './os.ts';

type Line = string | Node | (string | Node)[];

export function initTerminal(root: HTMLElement) {
  const d = data();
  const s = d.s.term;
  const out = root.querySelector<HTMLElement>('[data-tty-out]')!;
  const form = root.querySelector<HTMLFormElement>('[data-tty-form]')!;
  const input = root.querySelector<HTMLInputElement>('[data-tty-in]')!;
  const cwdEl = root.querySelector<HTMLElement>('[data-tty-cwd]')!;
  let cwd = '~';
  const history: string[] = store.get('history', []);
  let hIndex = history.length;

  const sectionIds = d.sections.map((x) => x.id);
  const projectNames = d.projects.map((p) => p.name);
  const findProject = (q: string) => {
    const k = q.toLowerCase().replace(/\/$/, '');
    return d.projects.find((p) => p.name === k || p.slug === k) || d.projects.find((p) => p.name.startsWith(k) || p.slug.startsWith(k));
  };

  const el = (tag: string, cls?: string, text?: string) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const link = (text: string, href: string, external = false) => {
    const a = el('a', '', text) as HTMLAnchorElement;
    a.href = href;
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    return a;
  };
  function print(line: Line, cls = '') {
    const row = el('div', `tty-row ${cls}`);
    for (const part of Array.isArray(line) ? line : [line]) row.append(typeof part === 'string' ? document.createTextNode(part) : part);
    out.append(row);
    while (out.childElementCount > 220) out.firstElementChild?.remove();
    out.scrollTop = out.scrollHeight;
  }
  const muted = (t: string) => el('span', 'tty-muted', t);
  const accent = (t: string) => el('span', 'tty-accent', t);

  function grid(items: (string | Node)[]) {
    const g = el('div', 'tty-grid');
    for (const it of items) g.append(typeof it === 'string' ? el('span', '', it) : it);
    print(g);
  }

  const setCwd = (next: string) => {
    cwd = next;
    cwdEl.textContent = next;
  };

  const commands: Record<string, (args: string[], raw: string) => void> = {
    help() {
      print(accent(s.helpTitle));
      const g = el('div', 'tty-help');
      for (const [name, desc] of Object.entries(s.help)) {
        g.append(el('span', 'tty-accent', name), el('span', 'tty-muted', desc));
      }
      print(g);
    },
    ls(args) {
      const target = (args.find((a) => !a.startsWith('-')) || (cwd === '~' ? '' : cwd.replace('~/', ''))).replace(/\/$/, '');
      if (target === 'projects') {
        print(muted(s.lsProjects));
        grid(d.projects.map((p) => link(`${p.name}/`, p.page)));
        print(muted(s.lsTip));
      } else if (!target || target === '~') {
        grid([
          link('about.md', `${d.home}#about`),
          link('projects/', `${d.home}#projects`),
          link('activity/', `${d.home}#activity`),
          link('contact/', `${d.home}#contact`),
          link('uses.md', d.pages.uses),
          link('timeline/', d.pages.timeline),
          link('guestbook/', d.pages.guestbook),
        ]);
      } else {
        const p = findProject(target);
        if (p) commands.cat([p.name], '');
        else print(`ls: ${target}: ${s.noSuch}`, 'tty-err');
      }
    },
    cd(args) {
      const target = (args[0] || '~').replace(/\/$/, '');
      if (target === '~' || target === '..' || target === '/') {
        setCwd('~');
        go(`${d.home}#home`);
        return;
      }
      if (sectionIds.includes(target)) {
        setCwd(`~/${target}`);
        print([muted(`${s.going} `), `~/${target}`]);
        go(`${d.home}#${target}`);
        return;
      }
      if (['uses', 'timeline', 'guestbook'].includes(target)) return go(d.pages[target as 'uses']);
      const p = findProject(target);
      if (p) {
        print([muted(`${s.going} `), `~/projects/${p.name}`]);
        go(p.page);
      } else print(`cd: ${target}: ${s.noSuch}`, 'tty-err');
    },
    cat(args) {
      const target = args[0];
      if (!target) return print(s.catUsage, 'tty-err');
      if (/^about(\.md)?$/.test(target)) {
        for (const para of d.about) print(para);
        return;
      }
      if (/^uses(\.md)?$/.test(target)) return go(d.pages.uses);
      const p = findProject(target);
      if (!p) return print(`cat: ${target}: ${s.noSuch}`, 'tty-err');
      print(accent(`# ${p.title}`));
      print(p.desc);
      print(muted([p.cat, p.lang, ...p.stack.filter((x) => x !== p.lang)].filter(Boolean).join(' · ')));
      const links: Node[] = [link('→ page', p.page)];
      if (p.live) links.push(document.createTextNode('  '), link('→ live', p.live, true));
      if (p.repo) links.push(document.createTextNode('  '), link('→ code', p.repo, true));
      print(links);
    },
    open(args) {
      const p = args[0] && findProject(args[0]);
      if (!p) return print(`open: ${args[0] || ''}: ${s.noSuch}`, 'tty-err');
      print([muted(`${s.opening} `), p.title]);
      if (p.live) window.open(p.live, '_blank', 'noopener');
      else go(p.page);
    },
    neofetch() {
      const art = el('pre', 'tty-art', ' ██╗  ██╗\n ██║ ██╔╝\n █████╔╝\n ██╔═██╗\n ██║  ██╗\n ╚═╝  ╚═╝');
      const info = el('div', 'tty-info');
      const rows: [string, string][] = [
        ['OS', 'KrumOS 26.11'],
        ['Host', 'Stara Zagora, BG'],
        ['Shell', 'python · ts · java'],
        ['Projects', String(d.totals.projects)],
        ['Live', String(d.totals.live)],
        ['Theme', document.documentElement.dataset.theme || 'dark'],
      ];
      info.append(el('div', 'tty-accent', 'krum@stara-zagora'), muted('-----------------'));
      for (const [k, v] of rows) {
        const r = el('div');
        r.append(el('b', 'tty-accent', `${k}: `), document.createTextNode(v));
        info.append(r);
      }
      const box = el('div', 'tty-neofetch');
      box.append(art, info);
      print(box);
    },
    whoami() {
      print(s.whoami);
    },
    theme(args) {
      const want = args[0];
      if (want !== 'light' && want !== 'dark') return print(s.themeUsage, 'tty-err');
      setTheme(want);
      print([muted(`${s.themeSet} `), want]);
    },
    lang(args) {
      const want = args[0];
      if (want !== 'bg' && want !== 'en') return print(s.langUsage, 'tty-err');
      if (want === d.lang) return;
      print(muted(s.switching));
      location.href = d.altPath;
    },
    game() {
      document.querySelector<HTMLButtonElement>('[data-game-toggle]')?.click();
    },
    snake() {
      const btn = document.querySelector<HTMLButtonElement>('[data-snake-play]');
      if (btn) {
        btn.scrollIntoView({ block: 'center' });
        btn.click();
      } else go(`${d.home}#activity`);
    },
    achievements() {
      const got = found();
      const items = d.s.secrets.items;
      print(accent(`🏆 ${got.length}/${SECRETS.length}`));
      for (const id of SECRETS) {
        print(got.includes(id) ? ['✔ ', items[id].title, muted(` — ${items[id].hint}`)] : muted(`· ${d.s.secrets.locked}`));
      }
    },
    uses() {
      go(d.pages.uses);
    },
    timeline() {
      go(d.pages.timeline);
    },
    guestbook() {
      go(d.pages.guestbook);
    },
    async reboot() {
      const { boot } = await import('./boot.ts');
      boot(true);
    },
    clear() {
      out.textContent = '';
    },
    history() {
      if (!history.length) return print(muted(s.historyEmpty));
      history.slice(-20).forEach((h, i) => print([muted(`${String(history.length - Math.min(20, history.length) + i + 1).padStart(4)}  `), h]));
    },
    date() {
      print(new Intl.DateTimeFormat(d.lang === 'bg' ? 'bg-BG' : 'en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Sofia' }).format(new Date()));
    },
    uname() {
      print(s.uname);
    },
    echo(_args, raw) {
      print(raw.replace(/^echo\s?/, ''));
    },
    man(args) {
      const c = args[0];
      if (!c) return print(s.manUsage, 'tty-err');
      const desc = s.help[c];
      print(desc ? [accent(`${c}`), ` — ${desc}`] : `${s.manNone} ${c}`, desc ? '' : 'tty-err');
    },
    exit() {
      print(muted(s.exitMsg));
      const win = root.closest<HTMLElement>('.win');
      if (win) window.dispatchEvent(new CustomEvent('krumos:minimize', { detail: win }));
    },
    sudo() {
      print(s.sudo, 'tty-err');
      unlock('sudo');
    },
    rm(args) {
      if (args.some((a) => /^-\w*[rf]/.test(a))) {
        print(s.rm, 'tty-err');
        unlock('rm');
      } else print(`rm: ${s.noSuch}`, 'tty-err');
    },
  };
  const aliases: Record<string, string> = { '?': 'help', ll: 'ls', dir: 'ls', cls: 'clear', quit: 'exit', logout: 'exit', 'uname -a': 'uname' };

  function run(raw: string) {
    const line = raw.trim();
    const row = el('div', 'tty-row tty-cmd');
    row.append(el('span', 'tty-user', 'krum@stara-zagora'), muted(':'), el('span', 'tty-accent', cwd), muted('$ '), document.createTextNode(line));
    out.append(row);
    if (!line) return;
    if (history[history.length - 1] !== line) history.push(line);
    while (history.length > 50) history.shift();
    store.set('history', history);
    hIndex = history.length;
    const [first, ...args] = line.split(/\s+/);
    const name = aliases[first.toLowerCase()] || first.toLowerCase();
    const fn = commands[name];
    if (fn) fn(args, line);
    else print(`${first}: ${s.notFound}. ${s.hint}`, 'tty-err');
    out.scrollTop = out.scrollHeight;
  }

  function complete() {
    const value = input.value;
    const parts = value.split(/\s+/);
    let pool: string[];
    if (parts.length <= 1) pool = Object.keys(commands);
    else if (parts[0] === 'man') pool = Object.keys(commands);
    else if (parts[0] === 'cd') pool = [...sectionIds, 'uses', 'timeline', 'guestbook', ...projectNames];
    else if (parts[0] === 'cat') pool = ['about.md', ...projectNames];
    else if (parts[0] === 'theme') pool = ['light', 'dark'];
    else if (parts[0] === 'lang') pool = ['bg', 'en'];
    else pool = projectNames;
    const last = parts[parts.length - 1].toLowerCase();
    const matches = pool.filter((p) => p.startsWith(last));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = parts.join(' ') + ' ';
    } else if (matches.length > 1) {
      // Complete the common prefix, list the options.
      let prefix = matches[0];
      for (const m of matches) while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
      parts[parts.length - 1] = prefix;
      input.value = parts.join(' ');
      grid(matches.slice(0, 40));
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = '';
    run(v);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && input.value.trim()) {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp') {
      if (hIndex > 0) input.value = history[--hIndex] ?? '';
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      hIndex = Math.min(history.length, hIndex + 1);
      input.value = history[hIndex] ?? '';
      e.preventDefault();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.textContent = '';
    }
  });
  root.querySelectorAll<HTMLButtonElement>('[data-tty-run]').forEach((b) =>
    b.addEventListener('click', () => {
      run(b.dataset.ttyRun!);
      input.focus({ preventScroll: true });
    }),
  );
  root.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a, button, input')) return;
    if (!window.getSelection()?.toString()) input.focus({ preventScroll: true });
  });

  print(muted(s.hint));
  return { run, focus: () => input.focus() };
}
