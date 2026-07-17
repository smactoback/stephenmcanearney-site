export const SITE = {
  url: 'https://stephenmcanearney.com',
  title: 'Building 58',
  description:
    'Long essays on the three-layer AI stack — substrate, production, application — and where Australia sits in the value structure.',
  author: 'Stephen McAnearney',
  positioning:
    'Stephen McAnearney between Western Australia and NYC/SF.',
} as const;

export const NAV = [
  { label: '/Explorations', href: '/' },
  { label: '/AI Stack', href: '/stack' },
  { label: '/About', href: '/about' },
] as const;

export const SOCIAL = {
  linkedin: 'https://www.linkedin.com/in/stephenmcanearney',
  github: 'https://github.com/smactoback',
  rss: '/rss.xml',
} as const;

export const WORDS_PER_MINUTE = 200;
