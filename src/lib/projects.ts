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
  live: string;
  repos: RepoData[]; // primary first, then merged repositories
  links: { label: Text; url: string }[];
  cover: string | null;
  images: Image[];
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

export const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#edc789', TypeScript: '#6aa9ff', JavaScript: '#f6d66f', Java: '#ef9aa6', PHP: '#b4a6ef',
  HTML: '#f2a98d', CSS: '#8fb9ed', Rust: '#e3a37a', Shell: '#9be29b', PowerShell: '#7fb2e5',
  'C++': '#f08fb4', C: '#b9c4d4', Kotlin: '#c49cff', Dockerfile: '#7fc4e8', SCSS: '#e79ac6',
  Vue: '#7fd6a8', Svelte: '#ff9d7a', Go: '#7fd9e8', Batchfile: '#b8d98b', Jupyter: '#f3b27a',
  'Jupyter Notebook': '#f3b27a', Other: '#8fa7c4',
};
export const languageColor = (name: string) => LANGUAGE_COLORS[name] || LANGUAGE_COLORS.Other;

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

function fromRepos(primary: RepoData, children: RepoData[]): Project {
  const o: Override = config.overrides[primary.name] || {};
  const repos = [primary, ...children];
  const languages = mergeLanguages(repos);
  const gallery = (o.gallery || []).map((src) => ({ src, alt: '' }));
  const images = uniqueImages([...gallery, ...repos.flatMap((r) => r.images)]).slice(0, 10);
  const featuredRank = config.featured.indexOf(primary.name);
  const updatedAt = repos.map((r) => r.pushedAt).sort().at(-1)!;
  return {
    slug: slugify(primary.name),
    title: o.title || same(prettify(primary.name)),
    description: o.description || same(primary.description),
    contribution: o.contribution,
    caseStudy: o.caseStudy,
    category: o.category || guessCategory(primary.topics),
    featuredRank,
    isPrivate: false,
    live: primary.homepage,
    repos,
    links: o.links || [],
    cover: o.cover || images[0]?.src || null,
    images,
    stack: o.stack || languages.filter((l) => l.name !== 'Other').slice(0, 4).map((l) => l.name),
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
    projects.push({
      slug: m.slug,
      title: m.title,
      description: m.description,
      contribution: m.contribution,
      caseStudy: m.caseStudy,
      category: m.category,
      featuredRank: config.featured.indexOf(m.slug),
      isPrivate: true,
      live: m.live,
      repos: [],
      links: m.links || [],
      cover: m.cover || m.gallery?.[0] || null,
      images: (m.gallery || []).map((src) => ({ src, alt: '' })),
      stack: m.stack,
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

  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const projects = build();
export const featured = projects
  .filter((p) => p.featuredRank >= 0)
  .sort((a, b) => a.featuredRank - b.featuredRank);

export const generatedAt: string = data.generatedAt;
export const profile = data.profile;

export const totals = {
  projects: projects.length,
  stars: projects.reduce((a, p) => a + p.stars, 0),
  live: projects.filter((p) => p.live).length,
  languages: new Set(projects.flatMap((p) => p.repos.map((r) => r.language).filter(Boolean))).size,
};

export const categoriesInUse = (['web', 'school', 'desktop', 'games', 'tools'] as Category[]).filter((c) =>
  projects.some((p) => p.category === c),
);
