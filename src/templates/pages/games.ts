import { html, rawHtml } from '../../lib/html.ts';
import type { Game } from '../../lib/content.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { gameCard, gameMeta, postUrl } from '../cards.ts';
import { backLink, framedImage, linkButton, pageTitle } from '../ui.ts';

export function gamesPage(context: BuildContext): string {
  const content = html`
    <div class="flex flex-col gap-10">
      ${pageTitle('Games')}
      <div class="grid gap-x-[22px] gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        ${context.content.games.map(gameCard)}
      </div>
    </div>
  `;

  return renderPage(context, { path: '/games/', title: 'Games', activeNav: 'games' }, content);
}

export function gamePage(context: BuildContext, game: Game): string {
  const devlogs = context.content.devlogs.filter((post) => post.project === game.slug);

  const details = [
    ['Status', game.status],
    ['Platforms', game.platforms.join(', ')],
    ['Engine', game.engine],
    ['Released', game.year?.toString()],
    ['Role', game.role],
  ].filter(([, value]) => value);

  // Without a hero banner, fall back to the capsule at its normal size.
  const banner = game.hero
    ? framedImage(game.hero, 'aspect-[3840/1240]', { alt: game.title, priority: true, sizes: '1064px' })
    : game.cover && framedImage(game.cover, 'aspect-[460/215] max-w-[616px]', { alt: game.title, priority: true });

  const sidePanel = html`
    <aside class="panel flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-8">
      <dl class="flex flex-col gap-5">
        ${details.map(
          ([label, value]) => html`
            <div class="flex flex-col gap-1">
              <dt class="meta text-[11px]">${label}</dt>
              <dd class="text-sm first-letter:uppercase">${value}</dd>
            </div>
          `,
        )}
      </dl>

      ${
        game.links.length > 0 &&
        html`<div class="flex flex-col gap-2 [&>a]:w-full">
        ${game.links.map((link, i) => linkButton(link.label, link.url, i === 0 ? 'primary' : 'secondary'))}
      </div>`
      }
      ${
        devlogs.length > 0 &&
        html`<div class="flex flex-col gap-2">
        <p class="meta text-[11px]">Devlogs</p>
        ${devlogs
          .slice(0, 6)
          .map(
            (post) => html`<a href="${postUrl(post)}" class="text-sm text-accent-fg hover:text-fg">${post.title}</a>`,
          )}
        ${
          devlogs.length > 6 &&
          html`<a href="/devlogs/?filter=${game.slug}" class="meta hover:text-fg">all ${devlogs.length} →</a>`
        }
      </div>`
      }
    </aside>
  `;

  const content = html`
    <article class="flex flex-col gap-10">
      ${backLink('Games', '/games/')} ${banner}

      <header class="flex flex-col gap-2.5">
        <h1 class="text-4xl font-semibold tracking-tight">${game.title}</h1>
        <p class="meta">${gameMeta(game)}</p>
      </header>

      <div class="grid gap-12 lg:grid-cols-[minmax(0,680px)_minmax(0,1fr)] lg:gap-16">
        <div class="prose">${rawHtml(game.body.html)}</div>
        ${sidePanel}
      </div>
    </article>
  `;

  return renderPage(
    context,
    {
      path: `/games/${game.slug}/`,
      title: game.title,
      activeNav: 'games',
      description: game.body.excerpt || undefined,
      shareImage: game.cover?.url,
    },
    content,
  );
}
