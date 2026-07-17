import type { APIContext } from 'astro';
import rss from '@astrojs/rss';
import { getContainerRenderer as mdxRenderer } from '@astrojs/mdx';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { render } from 'astro:content';
import { SITE } from '../consts';
import { getPublishedPosts } from '../lib/posts';
import Sidenote from '../components/Sidenote.astro';

export const prerender = true;

export async function GET(context: APIContext) {
  // Container API renders each post (Markdown + MDX) to full HTML for the feed.
  const renderers = await loadRenderers([mdxRenderer()]);
  const container = await AstroContainer.create({ renderers });
  const posts = await getPublishedPosts();

  const items = [];
  for (const post of posts) {
    const { Content } = await render(post);
    const content = await container.renderToString(Content, {
      props: { components: { Sidenote } },
    });
    items.push({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/writing/${post.id}`,
      content,
    });
  }

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    trailingSlash: false,
    items,
  });
}
