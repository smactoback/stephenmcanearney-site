import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
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

export const collections = { writing };
