import { html, rawHtml } from '../../lib/html.ts';
import type { Post } from '../../lib/content.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { postUrl } from '../cards.ts';
import { mediaTag } from '../media.ts';
import { backLink, tag, tagList } from '../ui.ts';

// Used for both blog posts and devlogs. `list` is the section's posts, newest first.
export function postPage(context: BuildContext, post: Post, list: Post[]): string {
  const index = list.indexOf(post);
  const newer = list[index - 1];
  const older = list[index + 1];

  const isDevlog = post.section === 'devlogs';
  const sectionName = isDevlog ? 'Devlogs' : 'Blog';
  const game = isDevlog ? context.content.games.find((g) => g.slug === post.project) : undefined;

  let labels = tagList(post.tags);
  if (isDevlog && post.project) {
    labels = html`
      <div class="flex items-center gap-2">
        ${game ? html`<a href="/games/${game.slug}/">${tag(game.title)}</a>` : tag(post.project)}
        ${post.number && html`<span class="meta text-[11px]">#${post.number}</span>`}
      </div>
    `;
  }

  const pager =
    (newer || older) &&
    html`
      <nav class="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-7">
        ${
          older
            ? html`<a href="${postUrl(older)}" class="card flex flex-col gap-1.5">
              <span class="meta text-[11px]">← previous</span>
              <span class="card-title text-[15px] font-medium">${older.title}</span>
            </a>`
            : html`<span></span>`
        }
        ${
          newer &&
          html`<a href="${postUrl(newer)}" class="card flex flex-col items-end gap-1.5 text-right">
          <span class="meta text-[11px]">next →</span>
          <span class="card-title text-[15px] font-medium">${newer.title}</span>
        </a>`
        }
      </nav>
    `;

  const content = html`
    <article class="flex max-w-[680px] flex-col gap-7">
      ${backLink(sectionName, `/${post.section}/`)} ${labels}

      <header class="flex flex-col gap-4">
        <h1 class="text-[40px] leading-[1.1] font-semibold tracking-tight">${post.title}</h1>
        <p class="meta"><time datetime="${post.date}">${post.date.slice(0, 10)}</time> · ${post.readingMinutes} min</p>
      </header>

      ${
        !isDevlog &&
        post.image &&
        html`<div class="overflow-hidden rounded border border-line">
        ${mediaTag(post.image, { sizes: '680px', priority: true, className: 'w-full' })}
      </div>`
      }

      <div class="prose">${rawHtml(post.body.html)}</div>
      ${pager}
    </article>
  `;

  return renderPage(
    context,
    {
      path: postUrl(post),
      title: post.title,
      activeNav: post.section,
      description: post.excerpt || undefined,
      shareImage: post.image?.url,
    },
    content,
  );
}
