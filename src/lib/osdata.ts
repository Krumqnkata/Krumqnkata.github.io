// Data handed to the KrumOS browser scripts (terminal, palette, notifications…).
// Serialised into <script type="application/json" id="krumos-data"> by Base.astro.
import config from '../data/portfolio.config.ts';
import { projects, generatedAt, totals } from './projects.ts';
import { profile, streak, achievements, achievementText } from './github.ts';
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
    sections: (['home', 'projects', 'about', 'activity', 'uses', 'timeline', 'guestbook', 'contact'] as const).map((id) => ({
      id,
      label: ws[id],
      path: id === 'home' ? `${pre}/` : `${pre}/${id}/`,
    })),
    about: d.about.body.map(strip),
    ghs: d.gh,
    gh: {
      stats: profile?.stats ?? null,
      since: profile?.createdAt ?? null,
      streak,
      badges: achievements.map((a) => ({ title: achievementText(a, lang).title, count: a.count, text: achievementText(a, lang).text, url: achievementText(a, lang).url })),
    },
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
