// Data handed to the KrumOS browser scripts (terminal, palette, notifications…).
// Serialised into <script type="application/json" id="krumos-data"> by Base.astro.
import config from '../data/portfolio.config.ts';
import { projects, generatedAt, totals } from './projects.ts';
import { t, homePath, projectPath, prefix, type Lang } from '../i18n/index.ts';

const strip = (html: string) => html.replace(/<[^>]+>/g, '');

export function osData(lang: Lang, altPath: string) {
  const d = t(lang);
  const pre = prefix(lang);
  const ws = d.os.workspaces;
  return {
    lang,
    altPath,
    home: homePath(lang),
    owner: config.owner,
    email: config.email,
    generatedAt,
    totals: { projects: totals.projects, live: totals.live },
    pages: { uses: `${pre}/uses/`, timeline: `${pre}/timeline/`, guestbook: `${pre}/guestbook/` },
    sections: [
      { id: 'home', label: ws.home },
      { id: 'projects', label: ws.projects },
      { id: 'about', label: ws.about },
      { id: 'activity', label: ws.activity },
      { id: 'contact', label: ws.contact },
    ],
    about: d.about.body.map(strip),
    projects: projects.map((p) => ({
      slug: p.slug,
      name: (p.repos[0]?.name || p.slug).toLowerCase(),
      title: p.title[lang],
      desc: p.description[lang],
      cat: d.categories[p.category],
      lang: p.primaryLanguage,
      live: p.live,
      repo: p.repos[0]?.url || '',
      page: projectPath(lang, p.slug),
      created: p.createdAt,
      stack: p.stack.slice(0, 5),
    })),
    s: d.kos,
  };
}

export type OsData = ReturnType<typeof osData>;
