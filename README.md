# krumqnkata.github.io

My personal portfolio: **[krumqnkata.github.io](https://krumqnkata.github.io)** · [на български](https://krumqnkata.github.io/bg/)

The site rebuilds itself **every day** from my GitHub account. Every public, non-fork repository gets its own page with the full README, screenshots, live demo, CI status, latest release, languages and dates. There is a BG/EN switch and a light/dark theme.

## How it works

1. [`scripts/fetch-projects.mjs`](scripts/fetch-projects.mjs) reads my public repositories through the GitHub API. It renders each README as GitHub does, uses `README.en.md` / `README.bg.md` when they exist, fixes relative image paths, sanitizes the HTML and picks screenshots. The result goes to `src/data/generated/projects.json`.
2. [`src/data/portfolio.config.ts`](src/data/portfolio.config.ts) is the only file I edit by hand. It holds the featured projects, hidden repositories, merged repositories, BG/EN titles and descriptions, and projects with private source code.
3. [Astro](https://astro.build) builds static pages: `/` and `/projects/<name>/` in English, `/bg/` and `/bg/projects/<name>/` in Bulgarian.
4. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push, every day at 04:40 UTC, and on demand. It deploys the site to GitHub Pages.

## KrumOS features

- **Terminal** in the hero window: try `help`, `ls projects`, `open extruda`, `neofetch`, `theme light`. Tab completes, ↑↓ browse history.
- **Command palette:** `Ctrl+K` or `/` jumps to any section, project, page or action.
- **Windows:** – minimises to the taskbar, □ (or double-click the title) maximises, small windows can be dragged on large screens.
- **Snake** on the contribution calendar, the **bus game** (top bar), a **screensaver** after a minute idle and a short **boot screen** on the first visit.
- **git log** of recent commits, a **timeline** (`/timeline/`), **uses** (`/uses/`) and a **guestbook** (`/guestbook/`, giscus + GitHub Discussions).
- A few **hidden achievements**. Some are typed, some are pressed, one is lost. 🏆

Scripts live in `src/scripts/` (one module per feature, loaded on demand); their texts are in `src/i18n/index.ts` under `kos`.

## Adding or changing a project

- **New public repository:** nothing to do, it shows up the next day. A good description, topics, a homepage link and screenshots in the README (or in `docs/screenshots/`) make its page better.
- **Feature it, translate it, hide it or add private work:** edit `src/data/portfolio.config.ts`. There you also set `featured` (the 5 big cards), `minor` (shown last, behind "Show more"), `language` overrides and client work.
- **No screenshots?** The site uses a screenshot from `public/covers/<slug>.jpg`, then the website's `og:image`, then a generated cover. To capture live demos again: `node scripts/capture-covers.mjs` (needs Playwright's Chromium).
- **Refresh now:** *Actions → Build and deploy portfolio → Run workflow*, or run:

  ```bash
  gh workflow run deploy.yml -R Krumqnkata/Krumqnkata.github.io
  ```

GitHub pauses scheduled workflows in repositories with no activity for 60 days. If the daily refresh stops, run the workflow once by hand.

## Local development

```bash
npm install
npm run fetch   # needs `gh auth login` or a GH_TOKEN
npm run dev
```
