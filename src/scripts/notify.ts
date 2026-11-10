// Desktop-style notification for projects created in the last 7 days.
import { data, store, busy } from './os.ts';

export function notifyNewProjects() {
  const d = data();
  const n = d.s.notify;
  const built = Date.parse(d.generatedAt);
  const dismissed = store.get<string[]>('dismissed', []);
  const fresh = d.projects
    .filter((p) => p.repo && built - Date.parse(p.created) < 7 * 24 * 3600 * 1000 && !dismissed.includes(p.slug))
    .sort((a, b) => b.created.localeCompare(a.created))[0];
  let seen = false;
  try { seen = !!sessionStorage.getItem('krumos:notified'); } catch { /* ignore */ }
  if (!fresh || busy.game || seen) return;
  try { sessionStorage.setItem('krumos:notified', '1'); } catch { /* ignore */ }

  const day = (t: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sofia' }).format(t);
  const days = Math.round((Date.parse(day(Date.now())) - Date.parse(day(Date.parse(fresh.created)))) / 86400000);
  const when = days <= 0 ? n.today : days === 1 ? n.yesterday : d.lang === 'bg' ? `преди ${days} ${n.daysAgo}` : `${days} ${n.daysAgo}`;

  const box = document.createElement('aside');
  box.className = 'notify';
  box.setAttribute('role', 'status');
  const head = document.createElement('p');
  head.className = 'notify-head';
  head.textContent = `🔔 ${n.newProject} · ${when}`;
  const title = document.createElement('p');
  title.className = 'notify-title';
  title.textContent = fresh.title;
  const desc = document.createElement('p');
  desc.className = 'notify-desc';
  desc.textContent = fresh.desc;
  const actions = document.createElement('div');
  actions.className = 'notify-actions';
  const open = document.createElement('a');
  open.className = 'btn btn-primary btn-sm';
  open.href = fresh.page;
  open.textContent = n.open;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn btn-ghost btn-sm';
  close.textContent = n.dismiss;
  const dismiss = () => {
    store.set('dismissed', [...dismissed, fresh.slug]);
    box.classList.add('notify-out');
    setTimeout(() => box.remove(), 250);
  };
  close.addEventListener('click', dismiss);
  open.addEventListener('click', () => store.set('dismissed', [...dismissed, fresh.slug]));
  actions.append(open, close);
  box.append(head, title, desc, actions);
  document.body.append(box);
  setTimeout(() => box.isConnected && box.classList.add('notify-out'), 12000);
  setTimeout(() => box.remove(), 12400);
}
