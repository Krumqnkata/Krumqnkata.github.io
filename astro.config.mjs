import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://krumqnkata.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
