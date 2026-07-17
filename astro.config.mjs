// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/consts.ts';

// Static output. Cloudflare Pages serves /dist directly.
export default defineConfig({
  site: SITE.url,
  trailingSlash: 'never',
  integrations: [mdx(), react(), sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
