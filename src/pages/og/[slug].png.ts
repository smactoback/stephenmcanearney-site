import type { APIRoute, GetStaticPaths } from 'astro';
import { SITE } from '../../consts';
import { renderOg } from '../../lib/og';
import { getPublishedPosts } from '../../lib/posts';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPublishedPosts();
  return [
    {
      params: { slug: 'default' },
      props: { title: SITE.positioning, kicker: 'Deep tech' },
    },
    ...posts.map((post) => ({
      params: { slug: post.id },
      props: { title: post.data.title, kicker: 'Ground Truth' },
    })),
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg({ title: props.title, kicker: props.kicker });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
