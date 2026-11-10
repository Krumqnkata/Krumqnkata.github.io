// Extra data from the owner's GitHub profile: stats, social accounts, sponsoring,
// contributions to other people's repositories and profile achievements.
// Every part is optional: on any error it returns null / [] and the build goes on.

const UA = 'krumqnkata-portfolio-builder';

async function graphql(token, query, variables) {
  if (!token) return null;
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(20000),
    });
    const json = await res.json();
    if (json.errors?.length) console.warn('GraphQL warning:', json.errors.map((e) => e.message).join('; '));
    return json.data ?? null;
  } catch (error) {
    console.warn('GraphQL request failed:', error.message);
    return null;
  }
}

/** Profile stats; each block is its own query so one denied field does not hide the rest. */
export async function githubProfile(owner, token) {
  const vars = { login: owner };
  const [base, social, sponsoring, contributed] = await Promise.all([
    graphql(token, `query($login:String!){user(login:$login){
      createdAt location websiteUrl
      pullRequests{totalCount}
      contributionsCollection{totalCommitContributions totalPullRequestContributions totalIssueContributions
        totalRepositoriesWithContributedCommits restrictedContributionsCount}
    }}`, vars),
    graphql(token, `query($login:String!){user(login:$login){socialAccounts(first:10){nodes{provider displayName url}}}}`, vars),
    graphql(token, `query($login:String!){user(login:$login){sponsoring(first:10){nodes{
      ... on User{login name url avatarUrl} ... on Organization{login name url avatarUrl}}}}}`, vars),
    graphql(token, `query($login:String!){user(login:$login){repositoriesContributedTo(first:12, contributionTypes:[COMMIT, PULL_REQUEST], orderBy:{field:PUSHED_AT, direction:DESC}){nodes{
      nameWithOwner url description stargazerCount isPrivate isFork
      primaryLanguage{name}
      owner{login avatarUrl}
    }}}}`, vars),
  ]);
  const u = base?.user;
  if (!u) return null;
  const c = u.contributionsCollection;
  return {
    createdAt: u.createdAt,
    location: u.location,
    website: u.websiteUrl,
    stats: {
      commits: c.totalCommitContributions,
      pullRequests: c.totalPullRequestContributions,
      issues: c.totalIssueContributions,
      repos: c.totalRepositoriesWithContributedCommits,
      private: c.restrictedContributionsCount,
      pullRequestsAllTime: u.pullRequests.totalCount,
    },
    socials: (social?.user?.socialAccounts?.nodes ?? []).map((s) => ({ provider: s.provider.toLowerCase(), name: s.displayName, url: s.url })),
    sponsoring: (sponsoring?.user?.sponsoring?.nodes ?? [])
      .filter((s) => s?.login)
      .map((s) => ({ login: s.login, name: s.name || s.login, url: s.url, avatar: s.avatarUrl })),
    contributedTo: (contributed?.user?.repositoriesContributedTo?.nodes ?? [])
      .filter((r) => r && !r.isPrivate && r.owner.login.toLowerCase() !== owner.toLowerCase())
      .map((r) => ({
        name: r.nameWithOwner,
        url: r.url,
        description: r.description || '',
        stars: r.stargazerCount,
        language: r.primaryLanguage?.name || null,
        owner: r.owner.login,
        avatar: r.owner.avatarUrl,
      })),
  };
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function page(url, xhr = false) {
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; krumqnkata-portfolio-builder)', Accept: 'text/html' };
  if (xhr) headers['X-Requested-With'] = 'XMLHttpRequest';
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Achievements from the public profile page (GitHub has no API for them). */
export async function githubAchievements(owner) {
  try {
    const html = await page(`https://github.com/${encodeURIComponent(owner)}?tab=achievements`);
    const found = new Map();
    const re = /<a href="\/[^"?]+\?achievement=([a-z0-9-]+)&amp;tab=achievements"[^>]*>\s*<img src="([^"]+)"[^>]*alt="Achievement: ([^"]+)"[^>]*>(?:\s*<span[^>]*achievement-tier-label--([a-z]+)[^>]*>\s*x(\d+)\s*<\/span>)?/g;
    for (const m of html.matchAll(re)) {
      const [, slug, image, name, tier, count] = m;
      if (!found.has(slug)) found.set(slug, { slug, name: decode(name), image, tier: tier || null, count: count ? Number(count) : 1 });
    }
    const list = [...found.values()];
    await Promise.all(
      list.map(async (a) => {
        try {
          const detail = await page(`https://github.com/users/${encodeURIComponent(owner)}/achievements/${a.slug}/detail?hovercard=1`, true);
          const text = decode(detail.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
          const desc = text.match(new RegExp(`@${owner}\\s+([^.]+\\.)`, 'i'));
          a.description = desc ? `${owner} ${desc[1]}` : '';
          const dates = [...detail.matchAll(/datetime="([^"]+)"/g)].map((d) => d[1]).sort();
          a.unlockedAt = dates[0] || null;
        } catch {
          a.description = '';
          a.unlockedAt = null;
        }
      }),
    );
    return list;
  } catch (error) {
    console.warn('Achievements unavailable:', error.message);
    return [];
  }
}
