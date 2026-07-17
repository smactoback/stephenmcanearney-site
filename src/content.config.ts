import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const writing = defineCollection({
  loader: glob({ base: './src/content/writing', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    issue: z.string(),
    title: z.string(),
    dek: z.string(),
    pubDate: z.coerce.date(),
    words: z.number().int().nonnegative(),
    read: z.string(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

// Imported from the 2026 Squarespace export. The bodies are the original HTML
// rather than markdown: Squarespace indents its markup, and indented lines in
// markdown parse as code blocks, which would mangle the posts.
const previous = defineCollection({
  loader: file('./src/content/previous/posts.json'),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    sourceUrl: z.string(),
    html: z.string(),
  }),
});

export const collections = { writing, previous };
