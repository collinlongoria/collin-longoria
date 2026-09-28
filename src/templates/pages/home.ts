import { html, rawHtml } from '../../lib/html.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { gameCard, gameMeta, postLink, storyCard } from '../cards.ts';
import { framedImage, linkButton, sectionHeader } from '../ui.ts';
import { mediaTag } from '../media.ts';
import type { Post } from '../../lib/content.ts';

function postColumn(title: string, href: string, posts: Post[]) {
  if (posts.length === 0) return html``;
  return html`
    <section class="flex flex-col gap-2">
      ${sectionHeader(title, href)}
      <div>${posts.slice(0, 4).map(postLink)}</div>
    </section>
  `;
}

export function homePage(context: BuildContext): string {
  const { home, games, stories, blog, devlogs } = context.content;
  const pinnedGame = games.find((game) => game.pinned) ?? games[0];
  const otherGames = games.filter((game) => game !== pinnedGame).slice(0, 3);
  const hasIntro = home.body.html.trim() !== '' || home.image;

  const intro = html`
    <section class="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-7">
      ${
        home.image &&
        html`<div class="size-28 shrink-0 overflow-hidden rounded">
        ${mediaTag(home.image, { sizes: '112px', priority: true, className: 'size-full object-cover' })}
      </div>`
      }
      <div class="prose max-w-[560px] text-fg-2">${rawHtml(home.body.html)}</div>
    </section>
  `;

  const pinned =
    pinnedGame &&
    html`
      <section class="flex flex-col gap-4">
        ${sectionHeader('Pinned')}
        <div class="grid gap-6 lg:grid-cols-[minmax(0,616px)_minmax(0,1fr)] lg:gap-8">
          <a href="/games/${pinnedGame.slug}/" class="card">
            ${framedImage(pinnedGame.cover, 'aspect-[460/215]', {
              alt: pinnedGame.title,
              sizes: '(min-width: 1024px) 616px, 100vw',
            })}
          </a>
          <div class="flex flex-col items-start gap-3">
            <h3 class="text-2xl font-semibold">
              <a href="/games/${pinnedGame.slug}/" class="hover:text-accent-fg">${pinnedGame.title}</a>
            </h3>
            <p class="meta">${[gameMeta(pinnedGame), pinnedGame.platforms.join(', ')].filter(Boolean).join(' · ')}</p>
            ${
              pinnedGame.body.excerpt &&
              html`<p class="line-clamp-3 text-[15px] text-fg-2">${pinnedGame.body.excerpt}</p>`
            }
            ${pinnedGame.links[0] && linkButton(pinnedGame.links[0].label, pinnedGame.links[0].url)}
          </div>
        </div>
      </section>
    `;

  const content = html`
    <div class="flex flex-col gap-14">
      ${hasIntro && intro} ${pinned}

      <div class="grid gap-12 md:grid-cols-2">
        ${postColumn('Blog', '/blog/', blog)} ${postColumn('Devlogs', '/devlogs/', devlogs)}
      </div>

      <!-- Filled in by src/scripts/thoughts.ts; stays hidden if there are no thoughts yet. -->
      <section class="flex flex-col gap-4" data-home-thoughts hidden>
        ${sectionHeader('Thoughts', '/thoughts/')}
        <div class="grid gap-x-8 md:grid-cols-2" data-thought-list data-limit="2"></div>
      </section>

      ${
        stories.length > 0 &&
        html`<section class="flex flex-col gap-4">
        ${sectionHeader('Stories', '/stories/')}
        <div class="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-[repeat(auto-fill,200px)] sm:gap-x-8">
          ${stories.slice(0, 4).map(storyCard)}
        </div>
      </section>`
      }
      ${
        otherGames.length > 0 &&
        html`<section class="flex flex-col gap-4">
        ${sectionHeader('Games', '/games/')}
        <div class="grid gap-x-[22px] gap-y-10 sm:grid-cols-2 lg:grid-cols-3">${otherGames.map(gameCard)}</div>
      </section>`
      }
    </div>
  `;

  return renderPage(context, { path: '/', description: home.body.excerpt || undefined }, content);
}
