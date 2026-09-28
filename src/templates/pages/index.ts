import type { BuildContext } from '../layout.ts';
import { postUrl } from '../cards.ts';
import { homePage } from './home.ts';
import { aboutPage } from './about.ts';
import { gamePage, gamesPage } from './games.ts';
import { storiesPage, storyPages } from './stories.ts';
import { blogPage } from './blog.ts';
import { devlogsPage } from './devlogs.ts';
import { postPage } from './post.ts';
import { thoughtsPage } from './thoughts.ts';
import { guestbookPage } from './guestbook.ts';
import { contactPage } from './contact.ts';
import { adminPage } from './admin.ts';
import { notFoundPage } from './not-found.ts';

export interface BuiltPage {
  // "/games/" becomes dist/games/index.html; "/404.html" stays as is.
  path: string;
  html: string;
}

// Every page on the site. To add a page, write a template in this folder and list it here.
export function allPages(context: BuildContext): BuiltPage[] {
  const { games, stories, blog, devlogs } = context.content;

  return [
    { path: '/', html: homePage(context) },
    { path: '/about/', html: aboutPage(context) },
    { path: '/games/', html: gamesPage(context) },
    ...games.map((game) => ({ path: `/games/${game.slug}/`, html: gamePage(context, game) })),
    { path: '/stories/', html: storiesPage(context) },
    ...stories.flatMap((story) => storyPages(context, story)),
    { path: '/blog/', html: blogPage(context) },
    ...blog.map((post) => ({ path: postUrl(post), html: postPage(context, post, blog) })),
    { path: '/devlogs/', html: devlogsPage(context) },
    ...devlogs.map((post) => ({ path: postUrl(post), html: postPage(context, post, devlogs) })),
    { path: '/thoughts/', html: thoughtsPage(context) },
    { path: '/guestbook/', html: guestbookPage(context) },
    { path: '/contact/', html: contactPage(context) },
    { path: '/admin/', html: adminPage(context) },
    { path: '/404.html', html: notFoundPage(context) },
  ];
}
