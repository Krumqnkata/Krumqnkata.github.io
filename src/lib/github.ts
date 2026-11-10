// GitHub profile data for the site: stats, streaks, achievements (translated), socials.
import data from '../data/generated/projects.json';
import { contributions } from './projects.ts';
import type { Text } from '../data/portfolio.config.ts';

export interface Achievement { slug: string; name: string; image: string; tier: string | null; count: number; description: string; unlockedAt: string | null }
export interface Social { provider: string; name: string; url: string }
export interface Sponsee { login: string; name: string; url: string; avatar: string }
export interface Contributed { name: string; url: string; description: string; stars: number; language: string | null; owner: string; avatar: string }
interface Profile {
  createdAt: string;
  location: string | null;
  website: string | null;
  stats: { commits: number; pullRequests: number; issues: number; repos: number; private: number; pullRequestsAllTime: number };
  socials: Social[];
  sponsoring: Sponsee[];
  contributedTo: Contributed[];
}

const gh = (data as { github?: { profile: Profile | null; achievements: Achievement[] } }).github;
export const profile: Profile | null = gh?.profile ?? null;
export const achievements: Achievement[] = gh?.achievements ?? [];
export const socials: Social[] = profile?.socials ?? [];
export const sponsoring: Sponsee[] = profile?.sponsoring ?? [];
export const contributedTo: Contributed[] = profile?.contributedTo ?? [];

/** Known achievements in both languages; unknown ones fall back to GitHub's English text. */
const KNOWN: Record<string, { title: Text; text: Text }> = {
  'pull-shark': { title: { en: 'Pull Shark', bg: 'Pull Shark' }, text: { en: 'Opened pull requests that have been merged.', bg: 'Отворени pull request-и, които са merge-нати.' } },
  'pair-extraordinaire': { title: { en: 'Pair Extraordinaire', bg: 'Pair Extraordinaire' }, text: { en: 'Co-authored commits on merged pull requests.', bg: 'Съавтор на commit-и в merge-нати pull request-и.' } },
  yolo: { title: { en: 'YOLO', bg: 'YOLO' }, text: { en: 'Merged a pull request without a code review.', bg: 'Merge-на pull request без code review.' } },
  'public-sponsor': { title: { en: 'Public Sponsor', bg: 'Public Sponsor' }, text: { en: 'Publicly sponsors open-source work through GitHub Sponsors.', bg: 'Публично спонсорира open source чрез GitHub Sponsors.' } },
  quickdraw: { title: { en: 'Quickdraw', bg: 'Quickdraw' }, text: { en: 'Closed an issue or pull request within 5 minutes of opening.', bg: 'Затвори issue или pull request до 5 минути след отваряне.' } },
  starstruck: { title: { en: 'Starstruck', bg: 'Starstruck' }, text: { en: 'Created a repository that has many stars.', bg: 'Репо с много звезди.' } },
  'galaxy-brain': { title: { en: 'Galaxy Brain', bg: 'Galaxy Brain' }, text: { en: 'Answered discussions that were accepted as the answer.', bg: 'Отговори в дискусии, приети за верен отговор.' } },
  'heart-on-your-sleeve': { title: { en: 'Heart On Your Sleeve', bg: 'Heart On Your Sleeve' }, text: { en: 'Reacted with ❤️ on GitHub.', bg: 'Реагира с ❤️ в GitHub.' } },
  'open-sourcerer': { title: { en: 'Open Sourcerer', bg: 'Open Sourcerer' }, text: { en: 'Had pull requests merged in multiple public repositories.', bg: 'Merge-нати pull request-и в няколко публични репота.' } },
  'arctic-code-vault-contributor': { title: { en: 'Arctic Code Vault Contributor', bg: 'Arctic Code Vault Contributor' }, text: { en: 'Contributed code to the 2020 GitHub Archive Program.', bg: 'Код в GitHub Archive Program 2020.' } },
};

export function achievementText(a: Achievement, lang: 'en' | 'bg') {
  const k = KNOWN[a.slug];
  return {
    title: k?.title[lang] ?? a.name,
    text: k?.text[lang] ?? a.description,
    url: `https://github.com/${(data as { owner: string }).owner}?achievement=${a.slug}&tab=achievements`,
  };
}

/** Streaks and best day from the contribution calendar. */
function streaks() {
  const days = (contributions?.weeks ?? []).flat().sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let run = 0;
  let best = { date: '', count: 0 };
  let active = 0;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      active++;
      longest = Math.max(longest, run);
      if (d.count > best.count) best = { date: d.date, count: d.count };
    } else run = 0;
  }
  // Current streak: count back from the last day; today may still be empty.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i === days.length - 1) continue;
    else break;
  }
  return { current, longest, best, active };
}

export const streak = streaks();
