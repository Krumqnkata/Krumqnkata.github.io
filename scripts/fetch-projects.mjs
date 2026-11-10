#!/usr/bin/env node
// Pulls every public, original repository of the portfolio owner from the GitHub API
// and writes src/data/generated/projects.json for the Astro build.
// Runs daily in GitHub Actions; locally it falls back to `gh auth token`.
import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sanitizeHtml from 'sanitize-html';
import config from '../src/data/portfolio.config.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'data', 'generated', 'projects.json');
const OWNER = process.env.PORTFOLIO_OWNER || config.owner;
const API = 'https://api.github.com';
const CONCURRENCY = 6;

function resolveToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    console.warn('No GitHub token found; using unauthenticated requests (60/hour).');
    return '';
  }
}
const TOKEN = resolveToken();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET from the GitHub API with retries. Returns null on 404 when allowMissing. */
async function gh(path, { accept = 'application/vnd.github+json', allowMissing = false, text = false } = {}) {
  const headers = {
    Accept: accept,
    'User-Agent': 'krumqnkata-portfolio-builder',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    let res;
    try {
      res = await fetch(path.startsWith('http') ? path : API + path, { headers });
    } catch (error) {
      if (attempt === 3) throw new Error(`GitHub request failed for ${path}: ${error.message}`);
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    if (res.ok) return text ? res.text() : res.json();
    if (allowMissing && (res.status === 404 || res.status === 409)) return null;
    const retryable = [403, 429, 500, 502, 503, 504].includes(res.status);
    if (!retryable || attempt === 3) {
      throw new Error(`GitHub API ${res.status} for ${path}`);
    }
    const reset = Number(res.headers.get('retry-after')) || 2 ** attempt;
    await sleep(reset * 1000);
  }
  throw new Error(`GitHub API failed for ${path}`);
}

async function listRepositories() {
  const repos = [];
  for (let page = 1; ; page++) {
    const batch = await gh(`/users/${encodeURIComponent(OWNER)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error('Unexpected repository list response');
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const hidden = new Set(config.hidden.map((n) => n.toLowerCase()));
  // Fail closed: only public, non-fork repositories owned by the portfolio owner.
  return repos.filter(
    (r) =>
      r.private === false &&
      r.fork === false &&
      r.owner?.login?.toLowerCase() === OWNER.toLowerCase() &&
      !hidden.has(r.name.toLowerCase()),
  );
}

// ---------- README rendering ----------

const BADGE_PATTERN = /shields\.io|badge\.svg|badgen\.net|\/badges?\/|codecov\.io|forthebadge|github\.com\/[^/]+\/[^/]+\/workflows|komarev|vercel\.com\/button|deploy-button|star-history/i;

function makeResolvers(repo, readmePath) {
  const branch = repo.default_branch;
  const dir = readmePath.includes('/') ? readmePath.slice(0, readmePath.lastIndexOf('/') + 1) : '';
  const rawBase = `https://raw.githubusercontent.com/${repo.full_name}/${branch}/${dir}`;
  const blobBase = `https://github.com/${repo.full_name}/blob/${branch}/${dir}`;
  const isRelative = (u) => u && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);
  return {
    asset(url) {
      if (!url) return url;
      if (url.startsWith('/')) return `https://github.com${url}`;
      if (isRelative(url)) return new URL(url, rawBase).href;
      return url;
    },
    link(url) {
      if (!url) return url;
      if (url.startsWith('/')) return `https://github.com${url}`;
      if (isRelative(url)) return new URL(url, blobBase).href;
      return url;
    },
  };
}

function cleanReadme(html, repo, readmePath) {
  const { asset, link } = makeResolvers(repo, readmePath);
  // GitHub puts heading ids on a sibling permalink anchor; move them onto the heading.
  let source = html.replace(
    /<div class="markdown-heading"[^>]*>\s*<(h[1-6])[^>]*>([\s\S]*?)<\/\1>\s*<a id="user-content-([^"]*)"[^>]*>[\s\S]*?<\/a>\s*<\/div>/g,
    (_, tag, inner, id) => `<${tag} id="${id}">${inner}</${tag}>`,
  );
  source = source.replace(/href="#user-content-/g, 'href="#');

  const clean = sanitizeHtml(source, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'div', 'span', 'a', 'img', 'picture', 'source',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'blockquote', 'pre', 'code', 'kbd', 'samp', 'var',
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'sub', 'sup', 'small', 'abbr',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      'details', 'summary', 'figure', 'figcaption', 'video', 'input',
    ],
    allowedAttributes: {
      '*': ['id', 'align', 'title', 'dir', 'lang'],
      a: ['href', 'name', 'rel', 'target'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'data-only'],
      source: ['srcset', 'media', 'type'],
      video: ['src', 'controls', 'muted', 'loop', 'playsinline', 'poster', 'width'],
      td: ['colspan', 'rowspan', 'width', 'valign'],
      th: ['colspan', 'rowspan', 'width', 'valign'],
      col: ['span', 'width'],
      details: ['open'],
      input: ['type', 'checked', 'disabled'],
    },
    allowedClasses: {
      div: ['highlight', 'highlight-*', 'markdown-alert', 'markdown-alert-*'],
      p: ['markdown-alert-title'],
      span: ['pl-*'],
      pre: ['notranslate'],
      li: ['task-list-item'],
      ul: ['contains-task-list'],
      input: ['task-list-item-checkbox'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    exclusiveFilter: (frame) =>
      (frame.tag === 'a' && !frame.text.trim() && !frame.mediaChildren.length && !frame.attribs.name && !frame.attribs.id) ||
      (frame.tag === 'input' && frame.attribs.type !== 'checkbox'),
    transformTags: {
      a: (tag, attribs) => {
        const href = link(attribs.href);
        const out = { ...attribs, href };
        if (href && /^https?:/i.test(href)) {
          out.target = '_blank';
          out.rel = 'noopener noreferrer';
        }
        return { tagName: 'a', attribs: out };
      },
      img: (tag, attribs) => {
        const out = { ...attribs, src: asset(attribs.src), loading: 'lazy' };
        const mode = /#gh-(light|dark)-mode-only/.exec(attribs.src || '')?.[1];
        if (mode) out['data-only'] = mode;
        return { tagName: 'img', attribs: out };
      },
      source: (tag, attribs) => ({
        tagName: 'source',
        attribs: {
          ...attribs,
          srcset: (attribs.srcset || '')
            .split(',')
            .map((part) => {
              const [u, ...rest] = part.trim().split(/\s+/);
              return [asset(u), ...rest].join(' ');
            })
            .join(', '),
        },
      }),
      video: (tag, attribs) => ({ tagName: 'video', attribs: { ...attribs, src: asset(attribs.src) } }),
    },
  });

  const images = [];
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = match[0];
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
    if (!src) continue;
    const canonical = tag.match(/data-canonical-src="([^"]+)"/)?.[1] || src;
    const width = Number(tag.match(/\swidth="(\d+)/)?.[1] || 0);
    const alt = tag.match(/\salt="([^"]*)"/)?.[1] || '';
    if (BADGE_PATTERN.test(canonical) || BADGE_PATTERN.test(src)) continue;
    if (/\.svg(\?|$)/i.test(canonical)) continue;
    if (/#gh-(light|dark)-mode-only/.test(src)) continue;
    if (width && width < 160) continue;
    if (/badge|logo|icon|avatar|banner/i.test(alt) && !/screenshot|снимк/i.test(alt)) continue;
    images.push({ src: asset(src.replace(/&amp;/g, '&')), alt: decodeEntities(alt) });
  }
  return { html: clean, images };
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

async function renderFile(repo, path) {
  const html = await gh(`/repos/${repo.full_name}/contents/${encodeURI(path)}?ref=${encodeURIComponent(repo.default_branch)}`, {
    accept: 'application/vnd.github.html',
    allowMissing: true,
    text: true,
  });
  if (!html) return null;
  return cleanReadme(html, repo, path);
}

const IMAGE_FILE = /\.(png|jpe?g|gif|webp|avif)$/i;
const SCREENSHOT_DIRS = ['docs/screenshots', 'screenshots', 'docs/images', 'assets/screenshots', 'docs/img', 'images'];

async function screenshotFolder(repo, rootEntries) {
  const names = new Set(rootEntries.filter((e) => e.type === 'dir').map((e) => e.name));
  for (const dir of SCREENSHOT_DIRS) {
    if (!names.has(dir.split('/')[0])) continue;
    const entries = await gh(`/repos/${repo.full_name}/contents/${dir}?ref=${encodeURIComponent(repo.default_branch)}`, { allowMissing: true });
    if (!Array.isArray(entries)) continue;
    const files = entries.filter((e) => e.type === 'file' && IMAGE_FILE.test(e.name)).slice(0, 8);
    if (files.length) {
      return files.map((f) => ({ src: f.download_url, alt: f.name.replace(IMAGE_FILE, '').replace(/[-_]/g, ' ') }));
    }
  }
  return [];
}

// ---------- per-repository data ----------

const CI_PATTERN = /\b(ci|tests?|checks?|build|lint|quality|python|node)\b/i;
const SKIP_WORKFLOW = /pages|deploy|codeql|dependabot|release|stale|label|greet|profile|snake/i;

async function describe(repo) {
  const [languages, release, workflowList, rootEntries] = await Promise.all([
    gh(`/repos/${repo.full_name}/languages`, { allowMissing: true }),
    gh(`/repos/${repo.full_name}/releases/latest`, { allowMissing: true }),
    gh(`/repos/${repo.full_name}/actions/workflows?per_page=100`, { allowMissing: true }),
    gh(`/repos/${repo.full_name}/contents?ref=${encodeURIComponent(repo.default_branch)}`, { allowMissing: true }),
  ]);
  const entries = Array.isArray(rootEntries) ? rootEntries : [];
  const files = new Map(entries.filter((e) => e.type === 'file').map((e) => [e.name.toLowerCase(), e.name]));

  // README variants: README.md is the default; README.en.md / README.bg.md give the other language.
  const defaultName = files.get('readme.md') || [...files.values()].find((n) => /^readme(\.[a-z]+)?$/i.test(n));
  const enName = files.get('readme.en.md') || files.get('readme_en.md') || files.get('readme-en.md');
  const bgName = files.get('readme.bg.md') || files.get('readme_bg.md') || files.get('readme-bg.md');

  const [main, en, bg] = await Promise.all([
    defaultName ? renderFile(repo, defaultName) : null,
    enName ? renderFile(repo, enName) : null,
    bgName ? renderFile(repo, bgName) : null,
  ]);
  const readme = {
    en: (en || main)?.html || '',
    bg: (bg || main)?.html || '',
  };

  let images = [...(main?.images || []), ...(en?.images || [])];
  const seen = new Set();
  images = images.filter((img) => !seen.has(img.src) && seen.add(img.src)).slice(0, 8);
  if (!images.length) images = await screenshotFolder(repo, entries);

  const workflows = (workflowList?.workflows || [])
    .filter((w) => w.state === 'active' && w.path.startsWith('.github/workflows/'))
    .filter((w) => !SKIP_WORKFLOW.test(w.name + ' ' + w.path))
    .sort((a, b) => Number(CI_PATTERN.test(b.name + b.path)) - Number(CI_PATTERN.test(a.name + a.path)))
    .slice(0, 2)
    .map((w) => {
      const file = w.path.split('/').pop();
      return {
        name: w.name,
        url: `https://github.com/${repo.full_name}/actions/workflows/${file}`,
        badge: `https://github.com/${repo.full_name}/actions/workflows/${file}/badge.svg?branch=${encodeURIComponent(repo.default_branch)}`,
      };
    });

  return {
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description || '',
    homepage: repo.homepage || '',
    topics: repo.topics || [],
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    archived: repo.archived,
    language: repo.language,
    languages: languages || {},
    license: repo.license && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : null,
    defaultBranch: repo.default_branch,
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    hasPages: repo.has_pages,
    release: release
      ? { tag: release.tag_name, name: release.name || release.tag_name, url: release.html_url, publishedAt: release.published_at }
      : null,
    workflows,
    readme,
    images,
  };
}

/** Checks a project's website: is it up, and what is its og:image (used as a cover). */
async function probeSite(url) {
  if (!url || !/^https?:/i.test(url)) return { ok: false, image: null };
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'krumqnkata-portfolio-builder', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, image: null };
    const html = (await res.text()).slice(0, 200000);
    const tag = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i)?.[0];
    const content = tag?.match(/content=["']([^"']+)["']/i)?.[1];
    return { ok: true, image: content ? new URL(content, res.url).href : null };
  } catch {
    // Network trouble is not proof the site is down; keep the link.
    return { ok: true, image: null };
  }
}

/** Public contribution calendar for the last year (GraphQL). Optional: null when unavailable. */
async function contributions() {
  if (!TOKEN) return null;
  try {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'krumqnkata-portfolio-builder' },
      body: JSON.stringify({
        query: 'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount weekday}}}}}}',
        variables: { login: OWNER },
      }),
      signal: AbortSignal.timeout(20000),
    });
    const json = await res.json();
    const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal) {
      console.warn('Contribution calendar unavailable:', JSON.stringify(json?.errors?.[0]?.message || res.status));
      return null;
    }
    return {
      total: cal.totalContributions,
      weeks: cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, weekday: d.weekday }))),
    };
  } catch (error) {
    console.warn('Contribution calendar unavailable:', error.message);
    return null;
  }
}

/** Latest commits by the owner in repositories pushed during the last 45 days. */
async function recentCommits(repos) {
  const since = Date.now() - 45 * 24 * 3600 * 1000;
  const active = repos.filter((r) => Date.parse(r.pushed_at) > since);
  const lists = await mapLimit(active, CONCURRENCY, async (repo) => {
    const commits = await gh(`/repos/${repo.full_name}/commits?per_page=10`, { allowMissing: true });
    if (!Array.isArray(commits)) return [];
    return commits
      .filter((c) => c.author?.type !== 'Bot' && (c.author?.login || '').toLowerCase() === OWNER.toLowerCase())
      .map((c) => ({
        sha: c.sha.slice(0, 7),
        repo: repo.name,
        message: (c.commit?.message || '').split(/\r?\n/)[0].slice(0, 120),
        date: c.commit?.author?.date || c.commit?.committer?.date,
        url: c.html_url,
      }));
  });
  return lists.flat().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index], index);
      }
    }),
  );
  return results;
}

async function main() {
  const started = Date.now();
  const repos = await listRepositories();
  console.log(`Found ${repos.length} public repositories for ${OWNER}.`);
  const projects = await mapLimit(repos, CONCURRENCY, async (repo) => {
    const data = await describe(repo);
    const site = data.homepage ? await probeSite(data.homepage) : { ok: false, image: null };
    data.ogImage = site.image;
    data.homepageOk = site.ok;
    console.log(`  ✓ ${repo.name} (${data.images.length} images, ${data.workflows.length} workflows)`);
    return data;
  });
  const user = await gh(`/users/${encodeURIComponent(OWNER)}`);
  const calendar = await contributions();
  const commits = await recentCommits(repos);
  const payload = {
    owner: OWNER,
    generatedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      avatar: user.avatar_url,
      followers: user.followers,
      publicRepos: user.public_repos,
      url: user.html_url,
    },
    contributions: calendar,
    recentCommits: commits,
    projects,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${projects.length} projects to ${OUT} in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
