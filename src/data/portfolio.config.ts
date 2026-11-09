// Hand-written portfolio settings. Everything else comes from GitHub every day.
// - Every public, non-fork repository appears automatically.
// - `hidden` removes a repository, `merge` folds a repository into another project,
//   `overrides` adds titles, bilingual descriptions and notes, `manual` adds private work.

export type Text = { en: string; bg: string };
export type Category = 'web' | 'school' | 'desktop' | 'games' | 'tools';

export interface Override {
  title?: Text;
  description?: Text;
  /** What I did on the project. */
  contribution?: Text;
  category?: Category;
  /** Large image for cards. Defaults to the first image found in the README. */
  cover?: string;
  /** Extra images shown before the README images. */
  gallery?: string[];
  /** Short stack list shown on cards. Defaults to the repository languages. */
  stack?: string[];
  links?: { label: Text; url: string }[];
  /** Optional HTML "case study" shown above the README. */
  caseStudy?: Text;
}

export interface ManualProject extends Override {
  slug: string;
  title: Text;
  description: Text;
  category: Category;
  live: string;
  /** ISO date used for sorting. */
  date: string;
  stack: string[];
}

const RAW = 'https://raw.githubusercontent.com/Krumqnkata/Krumqnkata/main/assets';

const config = {
  owner: 'Krumqnkata',
  siteUrl: 'https://krumqnkata.github.io',
  email: 'krumidanikrumov@abv.bg',

  /** Repositories never shown (forks and private repositories are always excluded). */
  hidden: ['Krumqnkata', 'Krumqnkata.github.io', 'league-of-assholes'],

  /** Shown first, in this order, as large cards. Repository names or manual slugs. */
  featured: [
    'PGKNMA-Blog',
    'extruda',
    'stara-zagora-transit',
    'noise-measure-tool',
    'python-raw-processor',
    'mydesk',
    'become-millionaire',
    'terminal-game',
  ],

  /** child repository → parent repository. The child becomes part of the parent's page. */
  merge: {
    'pgknma-blog-backend': 'PGKNMA-Blog',
    'cybersecurity-keylogger': 'cybersecurity-fake-virus',
  } as Record<string, string>,

  overrides: {
    'PGKNMA-Blog': {
      title: { en: 'PGKNMA Blog — School Digital Platform', bg: 'ПГКНМА Блог — дигитална платформа на училището' },
      description: {
        en: 'A school platform for articles, events, polls, profiles and notifications, with a React frontend, Django REST API and administration tools. Open source under AGPL-3.0.',
        bg: 'Училищна платформа за публикации, събития, анкети, профили и известия с React интерфейс, Django REST API и администрация. Отворен код под AGPL-3.0.',
      },
      contribution: {
        en: 'Frontend, backend API, deployment and maintenance, together with <a href="https://github.com/ythef0">ythef0</a> and <a href="https://github.com/lkbonev72">lkbonev72</a>.',
        bg: 'Интерфейс, backend API, разгръщане и поддръжка, заедно с <a href="https://github.com/ythef0">ythef0</a> и <a href="https://github.com/lkbonev72">lkbonev72</a>.',
      },
      category: 'school',
      cover: `${RAW}/pgknma-blog-homepage.png`,
      gallery: [`${RAW}/pgknma-blog-homepage.png`, `${RAW}/pgknma-blog-cover.jpg`],
      stack: ['React', 'TypeScript', 'Vite', 'Django REST', 'MySQL', 'Web Push'],
      caseStudy: {
        en: `<p>The platform combines a separate <strong>React frontend</strong> and <strong>Django backend</strong>, with <strong>MySQL for production data</strong>.</p>
<p><img src="${RAW}/pgknma-blog-architecture.svg" alt="Simplified architecture: React and TypeScript exchange JSON with Django REST Framework; Django accesses MySQL through its ORM and includes a Django Unfold administration panel." loading="lazy"></p>
<ul>
<li><strong>Interface:</strong> React, TypeScript and Vite power the pages; TanStack Query fetches and caches server data.</li>
<li><strong>API &amp; administration:</strong> Django REST Framework validates requests and applies permissions. Django Unfold provides the content administration interface.</li>
<li><strong>Data &amp; deployment:</strong> MySQL stores production records, with SQLite for local development. The React build and Django service run on Linux and Apache.</li>
<li><strong>Accounts &amp; notifications:</strong> JWT sessions that users can review and revoke, Google sign-in, email verification and Cloudflare Turnstile against spam. Browser Web Push delivers notifications.</li>
<li><strong>Quality &amp; security:</strong> GitHub Actions runs type checks, linting, Vitest and accessibility tests on the frontend and 400+ Django tests on the backend. CodeQL, Dependabot and secret scanning watch both repositories.</li>
</ul>
<p><strong>One request in practice:</strong> when the news page needs fresh data, the frontend requests posts from the API. Django queries the database and returns JSON, which React uses to render the page.</p>`,
        bg: `<p>Платформата се състои от отделен <strong>React интерфейс</strong> и <strong>Django backend</strong>, а данните в продукция са в <strong>MySQL</strong>.</p>
<p><img src="${RAW}/pgknma-blog-architecture.svg" alt="Опростена архитектура: React и TypeScript обменят JSON с Django REST Framework; Django достъпва MySQL през ORM и има Django Unfold админ панел." loading="lazy"></p>
<ul>
<li><strong>Интерфейс:</strong> React, TypeScript и Vite; TanStack Query зарежда и кешира данните от сървъра.</li>
<li><strong>API и администрация:</strong> Django REST Framework валидира заявките и прилага правата. Django Unfold е админ панелът за съдържание.</li>
<li><strong>Данни и разгръщане:</strong> MySQL в продукция, SQLite за локална разработка. React build-ът и Django услугата работят на Linux и Apache.</li>
<li><strong>Акаунти и известия:</strong> JWT сесии, които потребителят вижда и може да прекрати, вход с Google, потвърждение на имейл и Cloudflare Turnstile срещу спам. Известията идват през Web Push.</li>
<li><strong>Качество и сигурност:</strong> GitHub Actions пуска type checks, linting, Vitest и тестове за достъпност на интерфейса и 400+ Django теста на backend-а. CodeQL, Dependabot и secret scanning следят и двете репота.</li>
</ul>
<p><strong>Една заявка на практика:</strong> когато страницата с новини иска данни, интерфейсът пита API-то. Django чете базата и връща JSON, от който React рисува страницата.</p>`,
      },
    },
    extruda: {
      title: { en: 'Extruda — 3D Print Workshop', bg: 'Extruda — работилница за 3D печат' },
      description: {
        en: 'A free in-browser 3D print workshop: name keychains, logos from SVG, Gridfinity bins, boxes, cookie cutters, stencils, lithophanes, ready-made models, G-code colour change and calibration. Exports STL/3MF and works offline.',
        bg: 'Безплатна работилница за 3D печат в браузъра: ключодържатели с име, лога от SVG, Gridfinity, кутии, резци за сладки, шаблони, литофании, готови модели, смяна на цвета в G-code и калибриране. STL/3MF, работи офлайн.',
      },
      category: 'tools',
      stack: ['TypeScript', 'Three.js', 'PWA', 'STL / 3MF'],
    },
    'stara-zagora-transit': {
      title: { en: 'Stara Zagora Transit', bg: 'Транспорт Стара Загора' },
      description: {
        en: 'An interactive city transport map with routes, stops, timetables and journey planning. Shows real GPS vehicle positions when the data feed is available.',
        bg: 'Интерактивна карта на градския транспорт с линии, спирки, разписания и планиране на маршрут. Показва реалните GPS позиции на превозните средства, когато има данни.',
      },
      category: 'web',
      stack: ['JavaScript', 'Python', 'GTFS', 'Leaflet', 'OpenStreetMap'],
    },
    'noise-measure-tool': {
      title: { en: 'Noise Meter', bg: 'Шумомер' },
      description: {
        en: 'A real-time sound level meter in the browser: live dB dial, sound source recognition with YAMNet, spectrum and third-octave bands, noise dose, EU and Bulgarian norms, recordings and printable reports.',
        bg: 'Шумомер в реално време в браузъра: циферблат в dB, разпознаване на източника с YAMNet, спектър и третинооктавни ленти, шумова доза, норми на ЕС и България, записи и протоколи за печат.',
      },
      category: 'tools',
      stack: ['Python', 'FastAPI', 'WebSocket', 'Tailwind', 'SQLite', 'YAMNet'],
    },
    'python-raw-processor': {
      title: { en: 'RAW Studio', bg: 'RAW Studio' },
      description: {
        en: 'A desktop RAW photo editor with automatic corrections, previews, per-photo edits and batch JPG/PNG export.',
        bg: 'Настолен редактор на RAW снимки с автоматични корекции, преглед, отделни настройки за всяка снимка и групов експорт в JPG/PNG.',
      },
      category: 'desktop',
      gallery: [`${RAW}/gallery/raw-studio-dark.png`, `${RAW}/gallery/raw-studio-light.png`],
      cover: `${RAW}/gallery/raw-studio-dark.png`,
      stack: ['Python', 'CustomTkinter', 'rawpy', 'OpenCV'],
    },
    mydesk: {
      title: { en: 'MyDesk', bg: 'MyDesk' },
      description: {
        en: 'A fast, encrypted remote desktop for Windows and Linux — an open alternative to AnyDesk and Parsec, written in Rust with egui.',
        bg: 'Бърз, криптиран отдалечен достъп до работен плот за Windows и Linux — отворена алтернатива на AnyDesk и Parsec, написана на Rust с egui.',
      },
      category: 'desktop',
      stack: ['Rust', 'egui', 'Windows', 'Linux'],
    },
    'become-millionaire': {
      title: { en: 'The Road to a Million', bg: '„Пътят към милиона“' },
      description: {
        en: 'A Bulgarian quiz show in the browser with a host, music, 547 questions and four difficulty levels.',
        bg: 'Куиз шоу в браузъра с водещ, музика, 547 въпроса и 4 трудности.',
      },
      category: 'games',
      stack: ['TypeScript', 'Vite', 'Web Audio'],
    },
    'terminal-game': {
      title: { en: 'HELIOS: Breach', bg: 'ХЕЛИОС: Проникване' },
      description: {
        en: 'A hacker puzzle game in the browser: break into a fictional corporation with real Linux commands, ciphers and encodings.',
        bg: 'Хакерска пъзел игра в браузъра: влез в системите на измислена корпорация с истински Linux команди, шифри и кодирания.',
      },
      category: 'games',
      stack: ['JavaScript', 'HTML', 'CSS', 'CTF'],
    },
    'AI-TV-COMPUTER_VISION': {
      title: { en: 'School AI', bg: 'School AI' },
      description: {
        en: 'A school information platform with QR badges, kiosk and display PWAs, an assistant and an administration panel for content and devices.',
        bg: 'Училищна информационна система с QR баджове, PWA за киоски и екрани, асистент и админ панел за съдържание и устройства.',
      },
      category: 'school',
      stack: ['Python', 'FastAPI', 'PostgreSQL', 'WebSocket', 'PWA'],
    },
    'bell-song-cutter': {
      title: { en: 'School Bell Cutter', bg: 'Резачка за училищен звънец' },
      description: {
        en: 'An audio tool that analyses songs, suggests the best excerpts for a school bell and lets you preview, adjust and export them.',
        bg: 'Аудио инструмент, който анализира песни, предлага най-подходящите откъси за училищен звънец и позволява преглед, настройка и експорт.',
      },
      category: 'school',
      stack: ['Python', 'librosa', 'FFmpeg'],
    },
    'Discord-Bot-Notifier': {
      title: { en: 'IT Club Discord Bot', bg: 'Ботът на ИТ клуба' },
      description: {
        en: 'A Discord bot and web admin panel for IT club meetings, notifications and community commands.',
        bg: 'Discord бот и уеб панел за сбирките на ИТ клуба, известия и забавни команди за общността.',
      },
      category: 'school',
      stack: ['Python', 'discord.py', 'FastAPI', 'SQLite'],
    },
    'cybersecurity-fake-virus': {
      title: { en: 'Cybersecurity Classroom Demos', bg: 'Уроци по киберсигурност' },
      description: {
        en: 'Two visible, harmless teaching tools for school cybersecurity lessons: a simulation of computer-incident symptoms and a keystroke demo that runs only with explicit start and stop.',
        bg: 'Два видими и безопасни инструмента за часовете по киберсигурност: симулация на симптоми на компютърен инцидент и демонстрация на клавишни събития с изричен старт и стоп.',
      },
      category: 'school',
      stack: ['Python', 'Tkinter', 'Windows'],
    },
    'ai-text-detector': {
      title: { en: 'AI Text Detector (Bulgarian)', bg: 'Детектор на ИИ текст' },
      description: {
        en: 'An educational detector for AI-written Bulgarian text, using stylometric features, explanations of why, a FastAPI service and a web panel.',
        bg: 'Учебен детектор на текст, писан от ИИ, за български — стилометрични признаци, обяснение защо, FastAPI и уеб панел.',
      },
      category: 'tools',
      stack: ['Python', 'scikit-learn', 'FastAPI', 'NLP'],
    },
    'PGKNMA-advent-calendar': {
      title: { en: 'PGKNMA Advent Calendar', bg: 'Адвент календар на ПГКНМА' },
      description: {
        en: 'An advent calendar for PGKNMA “Prof. Minko Balkanski”, Stara Zagora, built with Django 5, Unfold and MySQL.',
        bg: 'Адвент календар на ПГКНМА „Проф. Минко Балкански“ – Стара Загора. Django 5 + Unfold + MySQL.',
      },
      category: 'school',
      stack: ['Python', 'Django', 'Unfold', 'MySQL'],
    },
    'facebook-post-down': {
      title: { en: 'Facebook Post Downloader', bg: 'Сваляне на пост от Facebook' },
      description: {
        en: 'Downloads the text and photos of a Facebook post with Playwright.',
        bg: 'Сваля текста и снимките от пост във Facebook с Playwright.',
      },
      category: 'tools',
    },
    'project-troll-site': {
      title: { en: 'Troll Site', bg: 'Трол сайт' },
      description: {
        en: 'School team project: a deliberately frustrating parody of a 2010-era Bulgarian municipal website, in plain HTML, CSS and JavaScript.',
        bg: 'Училищен отборен проект: нарочно дразнеща пародия на общински сайт от 2010 г., на чист HTML, CSS и JavaScript.',
      },
      category: 'web',
    },
    'HTML-Portfolio': {
      title: { en: 'My First Portfolio', bg: 'Първото ми портфолио' },
      description: {
        en: 'My first personal portfolio page, built with plain HTML and CSS.',
        bg: 'Първата ми лична портфолио страница, на чист HTML и CSS.',
      },
      category: 'web',
    },
    'receptopis-react-project': {
      title: { en: 'Receptopis', bg: 'Рецептопис' },
      description: {
        en: 'A recipe search app with search by name or ingredient, recipe pages and favourites.',
        bg: 'Приложение за рецепти с търсене по име или съставка, страници с рецепти и любими.',
      },
      category: 'web',
    },
    CameraBoxGame: {
      title: { en: 'Camera Box Game', bg: 'Бокс с камера' },
      description: {
        en: 'An AR boxing game for two players, controlled with body movements through a webcam.',
        bg: 'AR бокс игра за двама играчи, управлявана с движения на тялото през уеб камера.',
      },
      category: 'games',
    },
    CameraFightGame: {
      title: { en: 'Camera Fight Game', bg: 'Битка с жестове' },
      description: {
        en: 'A real-time 1v1 fighting game controlled by hand gestures through a webcam, with client-server play.',
        bg: 'Бойна игра 1 срещу 1 в реално време, управлявана с жестове през уеб камера, с игра клиент-сървър.',
      },
      category: 'games',
    },
    'wordpress-history-portal-plugin': {
      title: { en: 'History Portal — WordPress Plugin', bg: 'Исторически портал — WordPress плъгин' },
      description: {
        en: 'A WordPress plugin for a history portal that pulls content from the Wikipedia API.',
        bg: 'WordPress плъгин за исторически портал, който взима съдържание от Wikipedia API.',
      },
      category: 'web',
    },
    'calorie-compass': {
      title: { en: 'Calorie Compass', bg: 'Calorie Compass' },
      description: {
        en: 'A fitness toolkit: meal planning plus body-fat, one-rep-max and portion calculators.',
        bg: 'Фитнес инструменти: планиране на хранене и калкулатори за телесни мазнини, максимално повторение и порции.',
      },
      category: 'web',
    },
    'cv-creator-hub': {
      title: { en: 'CV Creator Hub', bg: 'CV Creator Hub' },
      description: {
        en: 'A CV generator: fill in your details and build a résumé in the browser.',
        bg: 'Генератор на CV: попълваш данните си и автобиографията се прави в браузъра.',
      },
      category: 'web',
    },
    'School-Bell': {
      title: { en: 'School Bell', bg: 'Училищен звънец' },
      description: {
        en: 'An automatic school bell with a GUI for bell schedules and custom bell songs.',
        bg: 'Автоматичен училищен звънец с графичен интерфейс за графици и собствени мелодии.',
      },
      category: 'school',
    },
    CoffeeMachine: {
      title: { en: 'Coffee Machine', bg: 'Кафе машина' },
      description: {
        en: 'A coffee vending machine simulator with a Java Swing GUI, admin mode and sales log.',
        bg: 'Симулатор на кафе автомат с Java Swing интерфейс, администраторски режим и дневник на продажбите.',
      },
      category: 'desktop',
    },
  } as Record<string, Override>,

  /** Projects whose source code is private. */
  manual: [
    {
      slug: 'daniela-krumova-website',
      title: { en: 'Daniela Krumova — Professional Website', bg: 'Даниела Крумова — професионален сайт' },
      description: {
        en: 'A Bulgarian and English website for a speech therapy practice, with a responsive layout, service information and search-engine metadata.',
        bg: 'Сайт на български и английски за логопедична практика с адаптивен дизайн, информация за услугите и SEO.',
      },
      contribution: {
        en: 'Frontend, bilingual layouts and website presentation.',
        bg: 'Интерфейс, двуезични страници и цялостно представяне на сайта.',
      },
      category: 'web',
      live: 'https://logopedkrumova.com',
      date: '2026-08-07T00:00:00Z',
      stack: ['HTML', 'CSS', 'JavaScript', 'Responsive design', 'SEO'],
      links: [{ label: { en: 'English version', bg: 'Английска версия' }, url: 'https://logopedkrumova.com/en/' }],
    },
  ] as ManualProject[],

  toolkit: [
    { label: { en: 'Languages', bg: 'Езици' }, items: ['Python', 'Java', 'JavaScript', 'TypeScript', 'PHP', 'Rust'] },
    { label: { en: 'Web & APIs', bg: 'Уеб и API' }, items: ['React', 'FastAPI', 'Django REST', 'HTML', 'CSS', 'WordPress'] },
    { label: { en: 'Data', bg: 'Данни' }, items: ['PostgreSQL', 'MySQL', 'SQLite'] },
    { label: { en: 'Servers & deployment', bg: 'Сървъри и разгръщане' }, items: ['Linux / Debian', 'Docker', 'Apache', 'systemd', 'GitHub Actions'] },
    { label: { en: 'Desktop & media', bg: 'Настолни и медия' }, items: ['CustomTkinter', 'OpenCV', 'MediaPipe', 'rawpy', 'FFmpeg'] },
    { label: { en: 'Audio & ML', bg: 'Аудио и ML' }, items: ['librosa', 'YAMNet', 'scikit-learn', 'WebSocket'] },
    { label: { en: 'Hardware', bg: 'Хардуер' }, items: ['Arduino', 'RFID', '3D printing'] },
  ] as { label: Text; items: string[] }[],
};

export default config;
