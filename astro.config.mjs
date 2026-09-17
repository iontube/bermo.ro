import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import rehypeTabele from './src/pluginuri/rehype-tabele.mjs';

export default defineConfig({
  integrations: [mdx()],
  markdown: { rehypePlugins: [rehypeTabele] },
  site: 'https://bermo.ro',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    assets: 'resurse'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
