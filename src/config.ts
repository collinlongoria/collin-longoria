import type { IconName } from './templates/social-icons.ts';

export const site = {
  name: 'Collin',
  author: 'Collin Longoria',
  url: 'https://collinlongoria.com',
  language: 'en',

  // Public Turnstile key. Leave empty to turn the captcha off (it's always off locally).
  turnstileSiteKey: '0x4AAAAAAFF3Q5XOfxL8WzG5',
};

export const navigation = [
  { key: 'about', label: 'About Me', href: '/about/' },
  { key: 'games', label: 'Games', href: '/games/' },
  { key: 'stories', label: 'Stories', href: '/stories/' },
  { key: 'blog', label: 'Blog', href: '/blog/' },
  { key: 'devlogs', label: 'Devlogs', href: '/devlogs/' },
  { key: 'thoughts', label: 'Thoughts', href: '/thoughts/' },
  { key: 'guestbook', label: 'Guestbook', href: '/guestbook/' },
  { key: 'contact', label: 'Contact', href: '/contact/' },
] as const;

export type NavKey = (typeof navigation)[number]['key'];

// Icons in the footer of every page, in this order. Entries without a url are skipped.
// Available icons are listed in src/templates/social-icons.ts.
export const socialLinks: { label: string; icon: IconName; url: string }[] = [
  { label: 'X', icon: 'x', url: 'https://x.com/_CollinLongoria' },
  { label: 'Threads', icon: 'threads', url: 'https://www.threads.com/@collin.longoria' },
  { label: 'GitHub', icon: 'github', url: 'https://github.com/collinlongoria' },
  { label: 'LinkedIn', icon: 'linkedin', url: 'https://www.linkedin.com/in/collin-longoria/' },
  { label: 'itch.io', icon: 'itch', url: 'https://collin-longoria.itch.io' },
];
