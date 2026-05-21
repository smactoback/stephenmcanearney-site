# stephenmcanearney.com

Personal site for Stephen McAnearney — long-form "Ground Truth" writing plus
about / now pages. Built with Astro, deployed to Cloudflare Pages.

## Commands

| Command           | Action                                   |
| :---------------- | :--------------------------------------- |
| `npm run dev`     | Start the dev server at `localhost:4321` |
| `npm run build`   | Build the production site to `./dist/`   |
| `npm run preview` | Preview the build locally                |

## Editing content

- **Posts** — add Markdown or MDX files to `src/content/writing/`. Frontmatter:
  `title`, `description`, `pubDate`, optional `updatedDate`, `tags`, `draft`.
  Drafts are hidden from production builds.
- **/now page** — edit `src/data/now.md` directly.
- **About page** — edit prose and the work/education lists in `src/pages/about.astro`.
- **Site metadata & social links** — `src/consts.ts`. Confirm the LinkedIn and
  GitHub URLs there.

## How it works

- **Theme** — dark by default; light/system/dark toggle in the header, persisted
  to `localStorage`.
- **View transitions** — enabled site-wide via Astro's `<ClientRouter />`.
- **OG images** — generated per post at build time (`src/pages/og/[slug].png.ts`,
  `src/lib/og.ts`) using satori + resvg. Geist fonts for this live in
  `src/assets/og/`.
- **RSS** — `/rss.xml` carries full post content, rendered with the Container API.
- **Sitemap** — `/sitemap-index.xml` via `@astrojs/sitemap`.
