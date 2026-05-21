// Site-wide constants. Edit social URLs below to match your accounts.

export const SITE = {
  url: 'https://stephenmcanearney.com',
  title: 'Stephen McAnearney',
  // Used as the default <meta description> and OpenGraph description.
  description:
    'Investor and operator in deep tech. Writing on frontier hardware, venture, and building in Western Australia.',
  author: 'Stephen McAnearney',
  // One-line positioning shown on the homepage.
  positioning:
    'Investor and operator in deep tech. Operating in Australia and NYC/SF, based in Perth.',
} as const;

export const NAV = [
  { label: 'Writing', href: '/writing' },
  { label: 'About', href: '/about' },
  { label: 'Now', href: '/now' },
] as const;

// TODO: confirm these handles point at the right accounts.
export const SOCIAL = {
  email: 's.mcanearney@gmail.com',
  linkedin: 'https://www.linkedin.com/in/stephenmcanearney',
  github: 'https://github.com/smactoback',
  rss: '/rss.xml',
} as const;

// Reading speed used to estimate post reading time.
export const WORDS_PER_MINUTE = 200;
