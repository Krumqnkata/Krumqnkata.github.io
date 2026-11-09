export type Lang = 'en' | 'bg';
export const LANGS: Lang[] = ['en', 'bg'];

const en = {
  htmlLang: 'en',
  locale: 'en-GB',
  siteTitle: 'Krum — Krumqnkata · Portfolio',
  siteDescription:
    'Student developer from Stara Zagora, Bulgaria. Web apps, desktop tools, games and 3D-printing utilities in Python, Java, TypeScript and Linux.',
  nav: { projects: 'Projects', about: 'About', activity: 'Activity', contact: 'Contact' },
  switchTo: 'BG',
  switchLabel: 'Прочети на български',
  themeLabel: 'Toggle light and dark theme',
  hero: {
    hello: "Hi, I'm",
    name: 'Krum',
    handle: 'Krumqnkata',
    lead: 'Student developer from <strong>Stara Zagora, Bulgaria</strong>. I build web apps, desktop tools, small games and things for my 3D printer — from the interface and API all the way to the server.',
    photoAlt: 'Photo of Krum',
    printed: 'printed 100%',
    ctaProjects: 'See my projects',
    ctaGithub: 'GitHub profile',
  },
  stats: { projects: 'projects', live: 'live demos', stars: 'stars', languages: 'languages', updated: 'updated' },
  featured: 'Featured work',
  featuredLead: 'The projects I am most proud of, with live demos and screenshots.',
  all: 'All projects',
  allLead: 'Everything public on my GitHub, refreshed automatically every day.',
  search: 'Search projects…',
  filterAll: 'All',
  sort: { label: 'Sort', recent: 'Recently updated', stars: 'Most stars', name: 'Name' },
  noResults: 'No projects match this search.',
  categories: { web: 'Web', school: 'School', desktop: 'Desktop', games: 'Games', tools: 'Tools & hardware' },
  card: { live: 'Live', code: 'Code', details: 'Details', private: 'Private source', updated: 'Updated' },
  about: {
    title: 'About me',
    body: [
      'I work with <strong>Python, Java, web technologies and Linux</strong>. I like taking an idea all the way: designing the interface, writing the API, setting up the database and keeping the server running.',
      'Most of my projects start with a real problem around me — a bus timetable, a noisy room, a photo that needs editing — and end as a tool other people actually use.',
    ],
    beyondTitle: 'Beyond the code',
    beyond:
      'I experiment with <strong>Arduino and RFID</strong>, work with <strong>3D printing</strong> and prepare <strong>audio</strong>. I enjoy the point where software meets a physical device, a printed object or something people hear and use.',
    toolkit: 'Toolkit',
  },
  activity: {
    title: 'GitHub activity',
    lead: 'Public repository statistics and my contribution calendar, refreshed daily.',
  },
  contact: {
    title: "Let's build something useful",
    body: "I'm interested in educational tools, web applications and everyday automation. For an idea, feedback or collaboration, write to me.",
    email: 'Email me',
  },
  footer: { tagline: 'Code is the beginning. Its usefulness gives it meaning.', rebuilt: 'Rebuilt from GitHub on', source: 'Site source' },
  project: {
    back: 'All projects',
    live: 'Live demo',
    code: 'Source code',
    backend: 'Backend code',
    release: 'Download',
    contribution: 'My contribution',
    overview: 'Technical overview',
    readme: 'README',
    gallery: 'Screenshots',
    languages: 'Languages',
    topics: 'Topics',
    facts: { stars: 'Stars', forks: 'Forks', license: 'License', created: 'Created', updated: 'Last update', release: 'Latest release' },
    privateNote: 'The source code of this project is private. Visit the live website to see it in action.',
    noReadme: 'This repository does not have a README yet.',
    viewOnGithub: 'View on GitHub',
    related: 'Part of this project',
  },
  game: {
    toggle: 'Game mode',
    on: 'Turn game mode on',
    off: 'Turn game mode off',
    help: 'Drive the little bus across the page and catch the bugs. ← → to move, ↑ or Space to jump, Esc to stop.',
    score: 'bugs fixed',
    win: 'All bugs fixed — ship it! 🚀',
  },
  os: {
    workspaces: { home: 'home', projects: 'projects', about: 'about', activity: 'activity', contact: 'contact' },
    workspacesLabel: 'Sections',
    clock: 'Local time in Stara Zagora',
    skip: 'Skip to content',
  },
  client: {
    kicker: 'Client work',
    title: 'Built for a client',
    lead: 'A real website for a real practice: designed, built and launched for the client.',
    did: 'What I delivered',
    cta: 'Have a project in mind?',
    ctaLink: 'Write to me',
    badge: 'Client',
    phoneAlt: 'The website on a phone',
  },
  more: { show: 'Show more', less: 'Show less' },
  htop: {
    title: 'GitHub activity',
    languages: 'Main language per project',
    tasks: 'Tasks',
    tasksValue: (p: number, l: number) => `${p} projects, ${l} live`,
    repos: 'Repos',
    since: 'Coding on GitHub since',
    contributions: (n: number) => `${n.toLocaleString('en-GB')} contributions in the last year`,
    less: 'Less',
    more: 'More',
    calendarLabel: 'Contribution calendar for the last year',
  },
  neofetch: { os: 'OS', host: 'Host', shell: 'Shell', projects: 'Projects', live: 'Live demos', uptime: 'Updated', hostValue: 'Stara Zagora, BG' },
  notFound: { title: 'Page not found', body: 'No such file or directory — but my projects exist.', home: 'cd ~' },
};

type Dict = typeof en;

const bg: Dict = {
  htmlLang: 'bg',
  locale: 'bg-BG',
  siteTitle: 'Крум — Krumqnkata · Портфолио',
  siteDescription:
    'Ученик-програмист от Стара Загора. Уеб приложения, настолни програми, игри и инструменти за 3D печат с Python, Java, TypeScript и Linux.',
  nav: { projects: 'Проекти', about: 'За мен', activity: 'Активност', contact: 'Контакт' },
  switchTo: 'EN',
  switchLabel: 'Read in English',
  themeLabel: 'Смени светла/тъмна тема',
  hero: {
    hello: 'Здравей, аз съм',
    name: 'Крум',
    handle: 'Krumqnkata',
    lead: 'Ученик-програмист от <strong>Стара Загора</strong>. Правя уеб приложения, настолни програми, малки игри и неща за 3D принтера си — от интерфейса и API-то до сървъра.',
    photoAlt: 'Снимка на Крум',
    printed: 'отпечатан 100%',
    ctaProjects: 'Виж проектите',
    ctaGithub: 'GitHub профил',
  },
  stats: { projects: 'проекта', live: 'live демота', stars: 'звезди', languages: 'езика', updated: 'обновено' },
  featured: 'Избрани проекти',
  featuredLead: 'Проектите, с които се гордея най-много — с live демо и снимки.',
  all: 'Всички проекти',
  allLead: 'Всичко публично от GitHub профила ми, обновява се автоматично всеки ден.',
  search: 'Търси проект…',
  filterAll: 'Всички',
  sort: { label: 'Подреди', recent: 'Последно обновени', stars: 'Най-много звезди', name: 'Име' },
  noResults: 'Няма проекти за това търсене.',
  categories: { web: 'Уеб', school: 'Училище', desktop: 'Настолни', games: 'Игри', tools: 'Инструменти и хардуер' },
  card: { live: 'Live', code: 'Код', details: 'Детайли', private: 'Частен код', updated: 'Обновен' },
  about: {
    title: 'За мен',
    body: [
      'Работя с <strong>Python, Java, уеб технологии и Linux</strong>. Обичам да водя една идея докрай: интерфейс, API, база данни и сървър, който работи.',
      'Повечето ми проекти започват от истински проблем около мен — разписание на автобус, шумна стая, снимка за обработка — и стават инструмент, който хората наистина ползват.',
    ],
    beyondTitle: 'Извън кода',
    beyond:
      'Експериментирам с <strong>Arduino и RFID</strong>, занимавам се с <strong>3D принтиране</strong> и подготвям <strong>аудио</strong>. Харесва ми мястото, където софтуерът среща истинско устройство, принтиран предмет или нещо, което хората чуват и ползват.',
    toolkit: 'Технологии',
  },
  activity: {
    title: 'Активност в GitHub',
    lead: 'Статистика за публичните репота и календар на приносите, обновявани всеки ден.',
  },
  contact: {
    title: 'Да направим нещо полезно',
    body: 'Интересуват ме образователни инструменти, уеб приложения и автоматизация на ежедневни задачи. За идея, отзив или съвместна работа — пиши ми.',
    email: 'Пиши ми',
  },
  footer: { tagline: 'Кодът е началото. Ползата му дава смисъл.', rebuilt: 'Обновено от GitHub на', source: 'Код на сайта' },
  project: {
    back: 'Всички проекти',
    live: 'Live демо',
    code: 'Изходен код',
    backend: 'Backend код',
    release: 'Изтегли',
    contribution: 'Моят принос',
    overview: 'Технически преглед',
    readme: 'README',
    gallery: 'Снимки',
    languages: 'Езици',
    topics: 'Теми',
    facts: { stars: 'Звезди', forks: 'Fork-ове', license: 'Лиценз', created: 'Създаден', updated: 'Последна промяна', release: 'Последна версия' },
    privateNote: 'Кодът на този проект е частен. Отвори сайта, за да го видиш в действие.',
    noReadme: 'Това репо още няма README.',
    viewOnGithub: 'Виж в GitHub',
    related: 'Част от проекта',
  },
  game: {
    toggle: 'Игра',
    on: 'Включи игровия режим',
    off: 'Изключи игровия режим',
    help: 'Карай малкия автобус по страницата и хващай бъговете. ← → за движение, ↑ или интервал за скок, Esc за край.',
    score: 'оправени бъга',
    win: 'Всички бъгове са оправени — пускай! 🚀',
  },
  os: {
    workspaces: { home: 'начало', projects: 'проекти', about: 'за мен', activity: 'активност', contact: 'контакт' },
    workspacesLabel: 'Секции',
    clock: 'Местно време в Стара Загора',
    skip: 'Към съдържанието',
  },
  client: {
    kicker: 'Работа за клиент',
    title: 'Направено за клиент',
    lead: 'Истински сайт за истинска практика: проектиран, направен и пуснат за клиента.',
    did: 'Какво направих',
    cta: 'Имаш идея за проект?',
    ctaLink: 'Пиши ми',
    badge: 'Клиент',
    phoneAlt: 'Сайтът на телефон',
  },
  more: { show: 'Покажи още', less: 'Покажи по-малко' },
  htop: {
    title: 'Активност в GitHub',
    languages: 'Основен език на проектите',
    tasks: 'Задачи',
    tasksValue: (p: number, l: number) => `${p} проекта, ${l} live`,
    repos: 'Репота',
    since: 'В GitHub от',
    contributions: (n: number) => `${n.toLocaleString('bg-BG')} приноса за последната година`,
    less: 'По-малко',
    more: 'Повече',
    calendarLabel: 'Календар на приносите за последната година',
  },
  neofetch: { os: 'OS', host: 'Хост', shell: 'Shell', projects: 'Проекти', live: 'Live демота', uptime: 'Обновено', hostValue: 'Стара Загора, BG' },
  notFound: { title: 'Няма такава страница', body: 'Няма такъв файл или директория — но проектите ми съществуват.', home: 'cd ~' },
};

export const dict: Record<Lang, Dict> = { en, bg };
export const t = (lang: Lang) => dict[lang];

/** Path prefix for a language: '' for English, '/bg' for Bulgarian. */
export const prefix = (lang: Lang) => (lang === 'en' ? '' : '/bg');
export const homePath = (lang: Lang) => `${prefix(lang)}/`;
export const projectPath = (lang: Lang, slug: string) => `${prefix(lang)}/projects/${slug}/`;
export const other = (lang: Lang): Lang => (lang === 'en' ? 'bg' : 'en');

export function formatDate(iso: string | null | undefined, lang: Lang, opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(dict[lang].locale, { ...opts, timeZone: 'Europe/Sofia' }).format(new Date(iso));
}
