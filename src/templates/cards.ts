import { html, type SafeHtml } from '../lib/html.ts';
import type { Game, Post, Story } from '../lib/content.ts';
import { framedImage, tag, tagList } from './ui.ts';

export function postUrl(post: Post): string {
  return `/${post.section}/${post.slug}/`;
}

export function gameMeta(game: Game): string {
  return [game.status, game.year].filter(Boolean).join(' · ');
}

export function gameCard(game: Game): SafeHtml {
  return html`
    <a href="/games/${game.slug}/" class="card flex flex-col gap-2.5">
      ${framedImage(game.cover, 'aspect-[460/215]', {
        alt: game.title,
        sizes: '(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw',
      })}
      <h3 class="card-title font-semibold">${game.title}</h3>
      <p class="meta -mt-1">${gameMeta(game)}</p>
    </a>
  `;
}

export function storyCard(story: Story): SafeHtml {
  return html`
    <a href="/stories/${story.slug}/" class="card flex flex-col gap-2.5" data-filter-values="${story.type}">
      ${framedImage(story.cover, 'aspect-[2/3]', { alt: story.title, sizes: '(min-width: 640px) 200px, 50vw' })}
      <h3 class="card-title text-[15px] font-semibold">${story.title}</h3>
      <div>${tag(story.type)}</div>
    </a>
  `;
}

export function postRow(post: Post): SafeHtml {
  return html`
    <article
      class="divider-below grid gap-2 py-5 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-6"
      data-filter-values="${post.tags.join('|')}"
    >
      <time class="meta pt-1" datetime="${post.date}">${post.date.slice(0, 10)}</time>
      <div class="flex min-w-0 flex-col gap-2">
        <h3 class="text-lg leading-snug font-medium">
          <a href="${postUrl(post)}" class="hover:text-accent-fg">${post.title}</a>
        </h3>
        ${post.excerpt && html`<p class="line-clamp-2 text-sm text-fg-2">${post.excerpt}</p>`}
        ${tagList(post.tags)}
      </div>
    </article>
  `;
}

// The short version used in the Blog and Devlogs columns on the home page.
export function postLink(post: Post): SafeHtml {
  return html`
    <a href="${postUrl(post)}" class="card divider-below flex items-center gap-4 py-3">
      <time class="meta shrink-0" datetime="${post.date}">${post.date.slice(5, 10)}</time>
      <span class="card-title min-w-0 truncate text-[15px] font-medium">${post.title}</span>
    </a>
  `;
}

export function devlogRow(post: Post, projectName?: string): SafeHtml {
  return html`
    <article
      class="divider-below grid gap-3 py-6 sm:grid-cols-[96px_minmax(0,1fr)_192px] sm:gap-6"
      data-filter-values="${post.project ?? ''}"
    >
      <time class="meta pt-1" datetime="${post.date}">${post.date.slice(0, 10)}</time>

      <div class="flex min-w-0 flex-col gap-2.5">
        ${
          post.project &&
          html`<div class="flex items-center gap-2">
          ${tag(projectName ?? post.project)}
          ${post.number && html`<span class="meta text-[11px]">#${post.number}</span>`}
        </div>`
        }
        <h3 class="text-lg leading-snug font-medium">
          <a href="${postUrl(post)}" class="hover:text-accent-fg">${post.title}</a>
        </h3>
        ${post.excerpt && html`<p class="line-clamp-2 text-sm text-fg-2">${post.excerpt}</p>`}
      </div>

      ${
        post.image
          ? html`<a href="${postUrl(post)}" class="card hidden sm:block" tabindex="-1" aria-hidden="true">
            ${framedImage(post.image, 'aspect-video', { sizes: '192px' })}
          </a>`
          : html`<span class="hidden sm:block"></span>`
      }
    </article>
  `;
}
