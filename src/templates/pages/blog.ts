import { html } from '../../lib/html.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { postRow, postUrl } from '../cards.ts';
import { filterChips, framedImage, pageTitle, tagList } from '../ui.ts';

export function blogPage(context: BuildContext): string {
  const posts = context.content.blog;
  const [latest, ...rest] = posts;
  const nextTwo = rest.slice(0, 2);
  const older = rest.slice(2);

  // The most used tags become filter buttons.
  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => ({ value: tag, label: tag }));

  const featured =
    latest &&
    html`
      <article class="divider-below grid gap-8 pb-10 md:grid-cols-[minmax(0,1fr)_minmax(0,460px)] md:gap-10">
        <div class="flex flex-col items-start gap-4">
          <p class="meta">${latest.date.slice(0, 10)} · ${latest.readingMinutes} min</p>
          <h2 class="text-[40px] leading-[1.1] font-semibold tracking-tight">
            <a href="${postUrl(latest)}" class="hover:text-accent-fg">${latest.title}</a>
          </h2>
          ${latest.excerpt && html`<p class="text-[15px] text-fg-2">${latest.excerpt}</p>`} ${tagList(latest.tags)}
        </div>
        ${
          latest.image &&
          html`<a href="${postUrl(latest)}" class="card">
          ${framedImage(latest.image, 'aspect-[460/300]', { sizes: '460px', priority: true })}
        </a>`
        }
      </article>
    `;

  const secondary =
    nextTwo.length > 0 &&
    html`
      <div class="grid gap-10 md:grid-cols-2">
        ${nextTwo.map(
          (post) => html`
            <article class="flex flex-col gap-3">
              <p class="meta">${post.date.slice(0, 10)}</p>
              <h2 class="text-2xl leading-snug font-semibold">
                <a href="${postUrl(post)}" class="hover:text-accent-fg">${post.title}</a>
              </h2>
              ${post.excerpt && html`<p class="line-clamp-3 text-[15px] text-fg-2">${post.excerpt}</p>`}
            </article>
          `,
        )}
      </div>
    `;

  // When a tag filter is picked, scripts/filters.ts swaps the front page for the plain list.
  const content = html`
    <div class="flex flex-col gap-10" data-filter-area>
      <div class="flex flex-col gap-6">${pageTitle('Blog')} ${filterChips(topTags)}</div>

      <div class="flex flex-col gap-10" data-front-page>
        ${featured} ${secondary}
        ${
          older.length > 0 &&
          html`<section>
          <h2 class="section-title">Older</h2>
          ${older.map(postRow)}
        </section>`
        }
      </div>

      <div data-filtered-list hidden>${posts.map(postRow)}</div>
    </div>
  `;

  return renderPage(context, { path: '/blog/', title: 'Blog', activeNav: 'blog' }, content);
}
