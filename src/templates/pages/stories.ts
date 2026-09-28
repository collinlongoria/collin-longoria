import { html, rawHtml, type SafeHtml } from '../../lib/html.ts';
import type { Story } from '../../lib/content.ts';
import { renderPage, type BuildContext } from '../layout.ts';
import { storyCard } from '../cards.ts';
import { backLink, filterChips, framedImage, pageTitle, tag } from '../ui.ts';

const TYPE_LABELS: Record<string, string> = {
  book: 'books',
  'short story': 'short stories',
  screenplay: 'screenplays',
};

export function storiesPage(context: BuildContext): string {
  const { stories } = context.content;
  const types = [...new Set(stories.map((story) => story.type))];

  const content = html`
    <div class="flex flex-col gap-10" data-filter-area>
      <div class="flex flex-col gap-6">
        ${pageTitle('Stories')}
        ${filterChips(types.map((type) => ({ value: type, label: TYPE_LABELS[type] ?? type })))}
      </div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(176px,1fr))]">
        ${stories.map(storyCard)}
      </div>
    </div>
  `;

  return renderPage(context, { path: '/stories/', title: 'Stories', activeNav: 'stories' }, content);
}

// Books get one page per chapter: /stories/my-book/ is chapter one, /stories/my-book/<chapter>/ the rest.
function chapterUrl(story: Story, index: number): string {
  if (index === 0) return `/stories/${story.slug}/`;
  return `/stories/${story.slug}/${story.chapters[index]!.slug}/`;
}

function storyHeader(story: Story, currentChapter: number): SafeHtml {
  const isBook = !story.screenplay && story.chapters.length > 1;
  const details = [
    story.year,
    `${story.wordCount.toLocaleString('en-US')} words`,
    isBook && `${story.chapters.length} chapters`,
  ].filter(Boolean);

  // A <details> element works as a dropdown without any JavaScript.
  const chapterMenu =
    isBook &&
    html`
    <details class="relative">
      <summary class="button button-secondary list-none">${story.chapters[currentChapter]!.title} ▾</summary>
      <ul class="panel absolute z-20 mt-2 max-h-80 w-64 overflow-y-auto p-1.5">
        ${story.chapters.map(
          (chapter, i) => html`
            <li>
              <a
                href="${chapterUrl(story, i)}"
                class="block truncate rounded px-3 py-2 text-sm hover:bg-surface ${
                  i === currentChapter ? 'text-fg' : 'text-fg-2'
                }"
                >${chapter.title}</a
              >
            </li>
          `,
        )}
      </ul>
    </details>
  `;

  return html`
    <header class="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
      ${
        story.cover &&
        html`<div class="w-[140px] shrink-0">
        ${framedImage(story.cover, 'aspect-[2/3]', { alt: story.title, sizes: '140px', priority: true })}
      </div>`
      }
      <div class="flex min-w-0 flex-col items-start gap-3">
        ${tag(story.type)}
        <h1 class="text-4xl font-semibold tracking-tight">${story.title}</h1>
        <p class="meta">${details.join(' · ')}</p>
        <div class="flex flex-wrap gap-2 pt-1">
          ${story.pdfUrl && html`<a href="${story.pdfUrl}" class="button button-primary" download>Download PDF</a>`}
          ${isBook && chapterMenu}
        </div>
      </div>
    </header>
  `;
}

function screenplayPage(context: BuildContext, story: Story): { path: string; html: string } {
  const content = html`
    <article class="flex flex-col gap-10">
      ${backLink('Stories', '/stories/')} ${storyHeader(story, 0)}
      <hr class="border-line" />
      <div class="w-full max-w-[640px] lg:ml-[260px]">${rawHtml(story.screenplay!.html)}</div>
    </article>
  `;

  const path = `/stories/${story.slug}/`;
  return {
    path,
    html: renderPage(
      context,
      { path, title: story.title, activeNav: 'stories', collapseSidebar: true, shareImage: story.cover?.url },
      content,
    ),
  };
}

export function storyPages(context: BuildContext, story: Story): { path: string; html: string }[] {
  if (story.screenplay) return [screenplayPage(context, story)];

  const isBook = story.chapters.length > 1;

  return story.chapters.map((chapter, i) => {
    const previous = story.chapters[i - 1];
    const next = story.chapters[i + 1];

    const chapterList = html`
      <nav class="hidden h-fit flex-col gap-2.5 lg:sticky lg:top-8 lg:flex" aria-label="Chapters">
        <p class="meta text-[11px]">Chapters</p>
        ${story.chapters.map(
          (other, j) => html`
            <a
              href="${chapterUrl(story, j)}"
              class="text-sm hover:text-fg ${j === i ? 'text-fg' : 'text-fg-2'}"
              ${j === i && html`aria-current="page"`}
              >${other.title}</a
            >
          `,
        )}
      </nav>
    `;

    const pager = html`
      <nav class="meta flex justify-between gap-4 pt-6 text-fg-2">
        ${
          previous
            ? html`<a href="${chapterUrl(story, i - 1)}" class="hover:text-fg">← ${previous.title}</a>`
            : html`<span></span>`
        }
        ${next && html`<a href="${chapterUrl(story, i + 1)}" class="text-right hover:text-fg">${next.title} →</a>`}
      </nav>
    `;

    const content = html`
      <article class="flex flex-col gap-10">
        ${backLink('Stories', '/stories/')} ${storyHeader(story, i)}
        <hr class="border-line" />

        <div class="grid gap-12 ${isBook && 'lg:grid-cols-[180px_minmax(0,640px)] lg:gap-20'}">
          ${isBook && chapterList}
          <div class="flex max-w-[640px] min-w-0 flex-col gap-6">
            ${isBook && html`<h2 class="text-[22px] font-semibold">${chapter.title}</h2>`}
            <div class="prose prose-story">${rawHtml(chapter.body.html)}</div>
            ${isBook && pager}
          </div>
        </div>
      </article>
    `;

    const path = chapterUrl(story, i);
    const title = isBook && i > 0 ? `${chapter.title} · ${story.title}` : story.title;
    return {
      path,
      html: renderPage(
        context,
        {
          path,
          title,
          activeNav: 'stories',
          collapseSidebar: true,
          description: story.excerpt || undefined,
          shareImage: story.cover?.url,
        },
        content,
      ),
    };
  });
}
