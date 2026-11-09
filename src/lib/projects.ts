import { existsSync } from 'node:fs';
import { join } from 'node:path';
import data from '../data/generated/projects.json';
import config, { type Category, type Override, type Text } from '../data/portfolio.config.ts';

export interface Workflow { name: string; url: string; badge: string }
export interface Release { tag: string; name: string; url: string; publishedAt: string }
export interface Image { src: string; alt: string }

export interface RepoData {
  name: string;
  fullName: string;
  url: string;
  description: string;
  homepage: string;
  homepageOk?: boolean;
  ogImage?: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  archived: boolean;
  language: string | null;
  languages: Record<string, number>;
  license: string | null;
  defaultBranch: string;
  createdAt: string;
  pushedAt: string;
  hasPages: boolean;
  release: Release | null;
  workflows: Workflow[];
  readme: Text;
  images: Image[];
}

export interface Project {
  slug: string;
  title: Text;
  description: Text;
  contribution?: Text;
  caseStudy?: Text;
  category: Category;
  featuredRank: number; // -1 when not featured
  isPrivate: boolean;
  isClient: boolean;
  /** Older or smaller projects, listed after the rest and behind "Show more". */
  isMinor: boolean;
  live: string;
  repos: RepoData[]; // primary first, then merged repositories
  links: { label: Text; url: string }[];
  /** Cover image; null means the generated cover art is used. */
  cover: string | null;
  /** Extra screenshot for client work (phone view). */
  coverMobile: string | null;
  images: Image[];
  /** The one language shown everywhere for this project. */
  primaryLanguage: string | null;
  stack: string[];
  topics: string[];
  languages: { name: string; share: number; color: string }[];
  stars: number;
  forks: number;
  license: string | null;
  release: Release | null;
  workflows: Workflow[];
  createdAt: string;
  updatedAt: string;
  readme: Text;
}

// Earthy colours that sit well on the olive / cornsilk palette and stay distinct.
export const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#dda15e', TypeScript: '#7fa7b8', JavaScript: '#e9c46a', Java: '#c97b63', PHP: '#9a8bb5',
  HTML: '#bc6c25', CSS: '#6f9f8a', Rust: '#b5654a', Shell: '#a3b86c', PowerShell: '#6c8fb0',
  'C++': '#c47a9a', C: '#9fa58a', Kotlin: '#a58bc4', Dockerfile: '#6fa2b0', SCSS: '#c48aa8',
  Vue: '#7fb58f', Svelte: '#d98a5f', Go: '#7fb8b8', Batchfile: '#a9b87a', 'Jupyter Notebook': '#d99a5a',
  Other: '#8f9a6a',
};
export const languageColor = (name: string | null | undefined) => (name && LANGUAGE_COLORS[name]) || LANGUAGE_COLORS.Other;

const CATEGORY_TOPICS: [Category, RegExp][] = [
  ['games', /^(game|browser-game|games|pygame|quiz|trivia|puzzle-game)$/],
  ['school', /^(school|education|classroom|pgknma|school-project|student-platform|educational-game)$/],
  ['desktop', /^(desktop-app|customtkinter|tkinter|swing|egui|remote-desktop)$/],
  ['tools', /^(3d-printing|arduino|cli|downloader|automation|audio|tool|tools)$/],
  ['web', /^(react|html|css|website|web|vite|wordpress|pwa|fastapi|django)$/],
];

function guessCategory(topics: string[]): Category {
  for (const [category, pattern] of CATEGORY_TOPICS) {
    if (topics.some((t) => pattern.test(t))) return category;
  }
  return 'tools';
}

function prettify(name: string) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const same = (s: string): Text => ({ en: s, bg: s });
const slugify = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Screenshots captured by scripts/capture-covers.mjs live in public/covers/<slug>.jpg. */
const PUBLIC = join(process.cwd(), 'public');
function localCover(slug: string) {
  const file = `covers/${slug}.jpg`;
  return existsSync(join(PUBLIC, file)) ? `/${file}` : null;
}

function mergeLanguages(repos: RepoData[]) {
  const totals: Record<string, number> = {};
  for (const repo of repos) {
    for (const [lang, bytes] of Object.entries(repo.languages)) totals[lang] = (totals[lang] || 0) + bytes;
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const main = sorted.filter(([, b]) => b / sum >= 0.02).slice(0, 6);
  const rest = sum - main.reduce((a, [, b]) => a + b, 0);
  const list = main.map(([name, bytes]) => ({ name, share: bytes / sum, color: languageColor(name) }));
  if (rest / sum >= 0.005) list.push({ name: 'Other', share: rest / sum, color: languageColor('Other') });
  return list;
}

function uniqueImages(images: Image[]) {
  const seen = new Set<string>();
  return images.filter((img) => (seen.has(img.src) ? false : (seen.add(img.src), true)));
}

/** Stack list that always starts with the primary language. */
function orderStack(stack: string[], primary: string | null) {
  if (!primary) return stack;
  return [primary, ...stack.filter((s) => s.toLowerCase() !== primary.toLowerCase())];
}

function fromRepos(primary: RepoData, children: RepoData[]): Project {
  const o: Override = config.overrides[primary.name] || {};
  const repos = [primary, ...children];
  const slug = slugify(primary.name);
  const languages = mergeLanguages(repos);
  const primaryLanguage = o.language || primary.language || languages[0]?.name || null;
  const gallery = (o.gallery || []).map((src) => ({ src, alt: '' }));
  const captured = localCover(slug);
  const images = uniqueImages([
    ...gallery,
    ...repos.flatMap((r) => r.images),
    ...(captured ? [{ src: captured, alt: '' }] : []),
  ]).slice(0, 10);
  const updatedAt = repos.map((r) => r.pushedAt).sort().at(-1)!;
  const live = primary.homepage && primary.homepageOk !== false ? primary.homepage : '';
  return {
    slug,
    title: o.title || same(prettify(primary.name)),
    description: o.description || same(primary.description),
    contribution: o.contribution,
    caseStudy: o.caseStudy,
    category: o.category || guessCategory(primary.topics),
    featuredRank: config.featured.indexOf(primary.name),
    isPrivate: false,
    isClient: false,
    isMinor: config.minor.includes(primary.name),
    live,
    repos,
    links: o.links || [],
    cover: o.cover || images[0]?.src || primary.ogImage || null,
    coverMobile: null,
    images,
    primaryLanguage,
    stack: orderStack(o.stack || languages.filter((l) => l.name !== 'Other').slice(0, 4).map((l) => l.name), primaryLanguage),
    topics: [...new Set(repos.flatMap((r) => r.topics))],
    languages,
    stars: repos.reduce((a, r) => a + r.stars, 0),
    forks: repos.reduce((a, r) => a + r.forks, 0),
    license: primary.license,
    release: primary.release || children.find((c) => c.release)?.release || null,
    workflows: repos.flatMap((r) => r.workflows),
    createdAt: repos.map((r) => r.createdAt).sort()[0],
    updatedAt,
    readme: primary.readme,
  };
}

function build(): Project[] {
  const repos = data.projects as RepoData[];
  const byName = new Map(repos.map((r) => [r.name, r]));
  const childNames = new Set(Object.keys(config.merge).filter((child) => byName.has(config.merge[child]) && byName.has(child)));

  const projects: Project[] = repos
    .filter((r) => !childNames.has(r.name))
    .map((r) => {
      const children = [...childNames].filter((c) => config.merge[c] === r.name).map((c) => byName.get(c)!);
      return fromRepos(r, children);
    });

  for (const m of config.manual) {
    const cover = m.cover || localCover(m.slug) || m.gallery?.[0] || null;
    const coverMobile = localCover(`${m.slug}-mobile`);
    const primaryLanguage = m.language || m.stack[0] || null;
    projects.push({
      slug: m.slug,
      title: m.title,
      description: m.description,
      contribution: m.contribution,
      caseStudy: m.caseStudy,
      category: m.category,
      featuredRank: config.featured.indexOf(m.slug),
      isPrivate: true,
      isClient: !!m.client,
      isMinor: false,
      live: m.live,
      repos: [],
      links: m.links || [],
      cover,
      coverMobile,
      images: [cover, coverMobile, ...(m.gallery || [])].filter((s): s is string => !!s).map((src) => ({ src, alt: '' })),
      primaryLanguage,
      stack: orderStack(m.stack, primaryLanguage),
      topics: [],
      languages: [],
      stars: 0,
      forks: 0,
      license: null,
      release: null,
      workflows: [],
      createdAt: m.date,
      updatedAt: m.date,
      readme: { en: '', bg: '' },
    });
  }

  // Newest first, but older/smaller projects always after the rest.
  return projects.sort((a, b) => Number(a.isMinor) - Number(b.isMinor) || b.updatedAt.localeCompare(a.updatedAt));
}

export const projects = build();
export const featured = projects
  .filter((p) => p.featuredRank >= 0)
  .sort((a, b) => a.featuredRank - b.featuredRank);
export const clientWork = projects.filter((p) => p.isClient);

export const generatedAt: string = data.generatedAt;
export const profile = data.profile;

type Calendar = { total: number; weeks: { date: string; count: number; weekday: number }[][] } | null;
export const contributions = ((data as { contributions?: Calendar }).contributions ?? null) as Calendar;

const original = projects.filter((p) => !p.isPrivate);
const languageCounts = Object.entries(
  original.reduce<Record<string, number>>((acc, p) => {
    if (p.primaryLanguage) acc[p.primaryLanguage] = (acc[p.primaryLanguage] || 0) + 1;
    return acc;
  }, {}),
).sort((a, b) => b[1] - a[1]);

export const totals = {
  projects: projects.length,
  stars: projects.reduce((a, p) => a + p.stars, 0),
  live: projects.filter((p) => p.live).length,
  languages: languageCounts.length,
  languageCounts,
  repos: original.reduce((a, p) => a + p.repos.length, 0),
  since: original.map((p) => p.createdAt).sort()[0],
};

export const categoriesInUse = (['web', 'school', 'desktop', 'games', 'tools'] as Category[]).filter((c) =>
  projects.some((p) => p.category === c),
);

/** Alt text for a project's screenshot. */
export function shotAlt(p: Project, lang: 'en' | 'bg', index = 0, alt = '') {
  if (alt) return alt;
  const base = lang === 'bg' ? `Екранна снимка на ${p.title.bg}` : `Screenshot of ${p.title.en}`;
  return index > 0 ? `${base} (${index + 1})` : base;
}
