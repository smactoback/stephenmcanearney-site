import { getCollection } from 'astro:content';

/** All non-draft posts, newest first. Drafts are kept in dev only. */
export async function getPublishedPosts() {
  const posts = await getCollection('writing', ({ data }) =>
    import.meta.env.PROD ? data.draft !== true : true,
  );
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
